import os
import json
import logging
from typing import Dict, Any, List, Optional
import dotenv

dotenv.load_dotenv()

logger = logging.getLogger("jasper_llm")

# System Prompt defining Jasper Butler persona & strict grounding standards
JASPER_SYSTEM_PROMPT = """You are Jasper, the refined, courteous, and impeccably polished English butler for ChronoBid — an elite AI-powered vintage antique auction house.

YOUR PERSONA & STANDARDS:
- Address the user respectfully ("Good day, sir/madam", "My pleasure, sir/madam").
- Be concise, warm, polished, and witty. Never be rude, haughty, or overly verbose.
- You are a knowledgeable connoisseur in vintage antiques, rare coins, fine luxury timepieces, clocks, classical paintings, sculptures, pottery, and strategic auction bidding.

STRICT ACCURACY & GROUNDING RULES:
1. You must NEVER invent ChronoBid platform rules, buyer fees, item prices, item details, or account balances.
2. Only state rules, prices, balances, or item details when they explicitly appear in the provided context (FAQ excerpts or user profile/escrow data).
3. If asked about something you are unsure of or that is not in the provided context, state so honestly ("I must confess I do not have that exact detail in my ledgers, sir") and politely suggest contacting ChronoBid customer support.

RECOMMENDATIONS & TOOL USE:
- If the user asks for item recommendations, suggestions, or advice on what to bid on, call the `get_recommendations` tool.
- When recommendations are returned by the tool, explain to the bidder why each item was selected, highlighting whether it comes from their personal Vault interest or overall market Trending activity.
- Always respect their escrow balance and mention whether items fit comfortably within their budget.
"""

# Anthropic Tool Definition for Recommendations
RECOMMENDATION_TOOL = {
    "name": "get_recommendations",
    "description": "Fetch personalized luxury item recommendations for a bidder from their personal Vault and market Trending activity.",
    "input_schema": {
        "type": "object",
        "properties": {
            "user_id": {
                "type": "integer",
                "description": "The numeric ID of the user requesting recommendations."
            },
            "top_n": {
                "type": "integer",
                "description": "Number of recommendations to retrieve (default 4)."
            }
        },
        "required": ["user_id"]
    }
}

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        # Conversation history memory keyed by user session (last 10 turns = 20 messages)
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        
        self.client = None
        if self.api_key:
            try:
                import anthropic
                self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
                logger.info("Anthropic AsyncClient initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")

    def get_session_key(self, user_role: str, user_id: Optional[int]) -> str:
        return f"{user_role.lower()}_{user_id or 'guest'}"

    def get_history(self, session_key: str) -> List[Dict[str, Any]]:
        return self.conversations.get(session_key, [])

    def add_to_history(self, session_key: str, role: str, content: Any):
        if session_key not in self.conversations:
            self.conversations[session_key] = []
        self.conversations[session_key].append({"role": role, "content": content})
        # Keep only the last 20 messages (10 turns)
        if len(self.conversations[session_key]) > 20:
            self.conversations[session_key] = self.conversations[session_key][-20:]

    async def chat(
        self,
        user_role: str,
        user_id: Optional[int],
        message: str,
        faq_context: Optional[str],
        recommender_engine: Any
    ) -> Dict[str, Any]:
        session_key = self.get_session_key(user_role, user_id)
        
        # Prepare System Grounding Context
        context_parts = [f"User Role: {user_role.capitalize()}"]
        if user_id:
            context_parts.append(f"User ID: {user_id}")
            
        if faq_context:
            context_parts.append(f"RELEVANT FAQ KNOWLEDGE BASE CONTEXT:\n{faq_context}")
        else:
            context_parts.append("RELEVANT FAQ KNOWLEDGE BASE CONTEXT: None found.")

        prompt_with_context = (
            f"[SYSTEM CONTEXT]\n" + "\n".join(context_parts) + "\n\n"
            f"[USER MESSAGE]\n{message}"
        )

        recommendations_collected = []

        # If Anthropic API Client is initialized, call Claude API
        if self.client:
            try:
                history = self.get_history(session_key)
                messages = list(history) + [{"role": "user", "content": prompt_with_context}]

                tools = [RECOMMENDATION_TOOL] if user_role.lower() == "bidder" else []

                response = await self.client.messages.create(
                    model=self.model_name,
                    system=JASPER_SYSTEM_PROMPT,
                    messages=messages,
                    tools=tools if tools else None,
                    max_tokens=600,
                    timeout=15.0
                )

                # Check if Claude requested a tool execution
                if response.stop_reason == "tool_use":
                    tool_use_block = next((b for b in response.content if b.type == "tool_use"), None)
                    if tool_use_block and tool_use_block.name == "get_recommendations":
                        input_args = tool_use_block.input
                        target_id = input_args.get("user_id") or user_id or 1
                        top_n = input_args.get("top_n", 4)

                        recs_result = recommender_engine.get_recommendations(user_id=target_id, top_n=top_n)
                        recommendations_collected = recs_result.get("recommendations", [])

                        # Append assistant message & tool execution result
                        messages.append({"role": "assistant", "content": response.content})
                        messages.append({
                            "role": "user",
                            "content": [
                                {
                                    "type": "tool_result",
                                    "tool_use_id": tool_use_block.id,
                                    "content": json.dumps(recs_result)
                                }
                            ]
                        })

                        # Second API call for final butler response formatting
                        final_response = await self.client.messages.create(
                            model=self.model_name,
                            system=JASPER_SYSTEM_PROMPT,
                            messages=messages,
                            max_tokens=600,
                            timeout=15.0
                        )
                        reply_text = "".join([b.text for b in final_response.content if hasattr(b, 'text')])
                    else:
                        reply_text = "".join([b.text for b in response.content if hasattr(b, 'text')])
                else:
                    reply_text = "".join([b.text for b in response.content if hasattr(b, 'text')])

                # Save turn to conversation history
                self.add_to_history(session_key, "user", message)
                self.add_to_history(session_key, "assistant", reply_text)

                return {
                    "jasper_reply": reply_text,
                    "recommendations": recommendations_collected
                }

            except Exception as e:
                logger.error(f"Anthropic API call failed: {e}. Falling back to default handler.")

        # --- FALLBACK HANDLER (When ANTHROPIC_API_KEY is not set or API fails) ---
        return self._fallback_handler(user_role, user_id, message, faq_context, recommender_engine, session_key)

    def _fallback_handler(
        self,
        user_role: str,
        user_id: Optional[int],
        message: str,
        faq_context: Optional[str],
        recommender_engine: Any,
        session_key: str
    ) -> Dict[str, Any]:
        message_lower = message.lower()
        recommendations = []

        if user_role.lower() == "bidder" and any(k in message_lower for k in ["recommend", "suggest", "bid on", "buy", "what to"]):
            if user_id:
                recs_res = recommender_engine.get_recommendations(user_id=user_id, top_n=4)
                recommendations = recs_res.get("recommendations", [])
                
                if recommendations:
                    items_formatted = []
                    for item in recommendations:
                        afford_str = "comfortably within budget" if item.get('affordable') else "may require additional escrow"
                        items_formatted.append(f"• **{item['title']}** (${item['price']:,.2f}) [{item['source'].upper()}]: {item['reason']} ({afford_str})")
                    
                    items_str = "\n".join(items_formatted)
                    reply = (
                        f"Good day, sir/madam. Based on your personal Vault activity and current market Trending data, "
                        f"I have selected the following items for your consideration:\n\n{items_str}\n\n"
                        f"Should you require further details on any lot, please let me know."
                    )
                else:
                    reply = "Good day. I was unable to retrieve specific recommendations at this moment, sir/madam."
            else:
                reply = "Good day, sir/madam. Please provide your bidder user ID so I may tailor recommendations to your vault."
        elif faq_context:
            reply = f"Good day, sir/madam. Regarding your inquiry:\n\n{faq_context}"
        else:
            if user_role.lower() == "seller":
                reply = "Good day, sir/madam. Welcome to your seller suite. You may upload item details or photos for verification at your convenience."
            elif user_role.lower() == "bidder":
                reply = "Good day, sir/madam. As your butler, I can assist with auction rules, bidding advice, or item recommendations. How may I serve you?"
            else:
                reply = "Good day. I am Jasper, butler at ChronoBid. I am pleased to assist you with general auction information."

        self.add_to_history(session_key, "user", message)
        self.add_to_history(session_key, "assistant", reply)

        return {
            "jasper_reply": reply,
            "recommendations": recommendations
        }
