import GuardianCircuitClient from "./GuardianCircuitClient";
import { guardianCircuitStages } from "./stages";
import styles from "./guardian-circuit.module.css";

export type GuardianCircuitProps = {
  className?: string;
  id?: string;
};

export default function GuardianCircuit({
  className,
  id = "guardian-circuit",
}: GuardianCircuitProps) {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <section
      id={id}
      className={[styles.section, className].filter(Boolean).join(" ")}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            Guardian Circuit
          </p>
          <h2 id={titleId}>Every action earns its way forward.</h2>
        </div>
        <p id={descriptionId}>
          A visible operating path keeps automation useful and accountable.
          Follow a signal from first trigger through human authority and a
          reviewable record.
        </p>
      </div>

      <div className={styles.frame}>
        <GuardianCircuitClient stages={guardianCircuitStages} />

        <div className={styles.fallback}>
          <div className={styles.viewport}>
            <div className={styles.viewportChrome} aria-hidden="true">
              <span>Guardian circuit map</span>
              <span>Static system view</span>
            </div>

            <ol
              className={styles.staticRail}
              aria-label="Guardian Circuit visual overview"
            >
              {guardianCircuitStages.map((stage, index) => (
                <li
                  key={stage.title}
                  className={index === 3 ? styles.railApproval : undefined}
                >
                  <span className={styles.railNode} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.visuallyHidden}>{stage.title}</span>
                </li>
              ))}
            </ol>

            <div className={styles.fallbackReadout}>
              <span>Human gate</span>
              <strong>Authority stays with your team.</strong>
            </div>
          </div>

          <ol
            className={styles.fallbackStages}
            aria-label="Guardian Circuit stage details"
          >
            {guardianCircuitStages.map((stage, index) => (
              <li key={stage.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{stage.title}</h3>
                  <p>{stage.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className={styles.note}>
        On supported devices, explore each checkpoint with the stage controls.
        The live circuit respects device and motion preferences.
      </p>
    </section>
  );
}
