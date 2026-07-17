from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from recommender_engine import RecommenderEngine

app = FastAPI(title="Chronobid Recommender API")
engine = RecommenderEngine()

class RecommendRequest(BaseModel):
    user_id: int
    top_n: int = 10

@app.on_event("startup")
def startup_event():
    print("Starting up Recommender API...")
    success = engine.load_data()
    if not success:
        print("WARNING: Data failed to load. Please run generate_large_mock_data.py")

@app.post("/recommend")
async def get_recommendations(req: RecommendRequest):
    result = engine.get_recommendations(req.user_id, req.top_n)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
