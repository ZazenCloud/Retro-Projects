import Link from "next/link";
import styles from './styles/home.module.css';
import { retro, pixelFont } from './fonts';

export default function Home() {
  // Add your prototypes to this array
  const prototypes = [
    {
      title: 'Getting started',
      description: 'How to create a prototype',
      path: '/prototypes/example'
    },
    {
      title: 'Confetti button',
      description: 'An interactive button that creates a colorful confetti explosion',
      path: '/prototypes/confetti-button'
    },
    // Add your new prototypes here like this:
    // {
    //   title: 'Your new prototype',
    //   description: 'A short description of what this prototype does',
    //   path: '/prototypes/my-new-prototype'
    // },
  ];

  return (
    <div className={`${styles.container} ${retro.className}`}>
      <div className={styles.y2kElements}>
        <div className={styles.palmTree}></div>
        <div className={styles.sunset}></div>
      </div>
      
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <div className={styles.windowControls}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h1 className={pixelFont.className}>Zen's Projects</h1>
        </header>

        <main>
          <section className={styles.grid}>
            {/* Goes through the prototypes list (array) to create cards */}
            {prototypes.map((prototype, index) => (
              <Link 
                key={index}
                href={prototype.path} 
                className={styles.card}
              >
                <h3>{prototype.title}</h3>
                <p>{prototype.description}</p>
              </Link>
            ))}
          </section>
        </main>
        
        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} AESTHETIC COMPUTING</p>
        </footer>
      </div>
    </div>
  );
}
