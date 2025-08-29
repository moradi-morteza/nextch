import styles from "./ChatBackground.module.scss";

export default function ChatBackground({ children, image = "/background.jpg", scrollRef }) {
  return (
    <section
      ref={scrollRef}
      className={`${styles.container}`}
      style={{
        backgroundImage:
          `radial-gradient(900px 600px at 0% 0%, var(--tg-grad-1) 0%, transparent 90%),` +
          `radial-gradient(900px 600px at 100% 80%, var(--tg-grad-2) 0%, transparent 90%),` +
          `radial-gradient(700px 500px at 60% -10%, var(--tg-grad-3) 0%, transparent 90%),` +
          `linear-gradient(180deg, rgba(255,255,255,0.0), rgba(0,0,0,0.06)),` +
          `url(${image})`,
      }}
    >
      {children}
    </section>
  );
}
