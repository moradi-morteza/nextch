import styles from "./ChatBackground.module.scss";

export default function ChatBackground({ children, image = "/background.jpg", scrollRef }) {
  return (
    <section
      ref={scrollRef}
      className={`${styles.container} tg-gradient-overlay`}
      style={{ backgroundImage: `url(${image})` }}
    >
      {children}
    </section>
  );
}
