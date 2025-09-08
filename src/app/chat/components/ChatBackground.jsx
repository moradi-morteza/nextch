import styles from "./ChatBackground.module.scss";

export default function ChatBackground({
                                           children,
                                           image = "/patterns/pattern-2.svg",
                                           scrollRef,
                                           patternOpacity = 0.25 // 0..1 (1 = fully visible)
                                       }) {
    const dim = 1 - Math.max(0, Math.min(1, patternOpacity)); // 0..1 white veil

    return (
        <section
            ref={scrollRef}
            className={`${styles.container} animate-pattern-fade`}
            style={{
                backgroundImage: [
                    `radial-gradient(900px 600px at 0% 0%, var(--tg-grad-1) 0%, transparent 90%)`,
                    `radial-gradient(900px 600px at 100% 80%, var(--tg-grad-2) 0%, transparent 90%)`,
                    `radial-gradient(700px 500px at 60% -10%, var(--tg-grad-3) 0%, transparent 90%)`,
                    // your vertical shade stays on top of the “dimmer”
                    `linear-gradient(180deg, rgba(255,255,255,0.0), rgba(0,0,0,0.06))`,
                    // this flat gradient is the dimmer that only hits the image
                    `linear-gradient(rgba(255,255,255,${dim}), rgba(255,255,255,${dim}))`,
                    `url(${image})`
                ].join(", ")
            }}
        >
            {children}
        </section>
    );
}
