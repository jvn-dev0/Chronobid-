import Link from 'next/link';
import s from './home.module.css';
import Logo from '../components/Logo';

export default function Home() {
  return (
    <div className={s.container}>
      <header className={s.header}>
        <Logo size={32} fontSize={28} />
        <nav className={s.nav}>
          <Link href="/login" className={s.loginBtn}>Sign In</Link>
          <Link href="/register" className={s.registerBtn}>Create Account</Link>
        </nav>
      </header>

      <main className={s.hero}>
        <h1 className={s.title}>
          The Premier Destination for<br />
          <span>Rare Collectibles</span>
        </h1>
        <p className={s.subtitle}>
          Discover, bid, and own authenticated historical artifacts, vintage watches, and rare treasures from around the world.
        </p>
        <div className={s.ctaGroup}>
          <Link href="/register" className={s.registerBtn}>Start Bidding</Link>
        </div>
      </main>
    </div>
  );
}
