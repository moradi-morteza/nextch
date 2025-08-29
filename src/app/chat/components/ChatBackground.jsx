export default function ChatBackground({ children, image = "/background.jpg", scrollRef }) {
  return (
    <section
      ref={scrollRef}
      className="flex-1 overflow-y-auto mx-auto w-full max-w-3xl px-3 py-3 bg-center bg-no-repeat bg-cover tg-gradient-overlay"
      style={{ backgroundImage: `url(${image})` }}
    >
      {children}
    </section>
  );
}

