import styles from "./StepIndicator.module.css";

const STEPS = [
  { id: 1, label: "Tài khoản" },
  { id: 2, label: "Phong cách" },
];

/**
 * `currentStep`: 1 | 2 — dùng ở /register và /register/style.
 */
export default function StepIndicator({ currentStep }) {
  return (
    <ol className={styles.wrap} aria-label="Tiến trình đăng ký">
      {STEPS.map((step, index) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;

        return (
          <li key={step.id} style={{ display: "contents" }}>
            <span
              className={`${styles.step} ${isActive ? styles.stepActive : ""} ${
                isDone ? styles.stepDone : ""
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={`${styles.dot} ${isActive ? styles.dotActive : ""} ${
                  isDone ? styles.dotDone : ""
                }`}
                aria-hidden="true"
              />
              {String(step.id).padStart(2, "0")} {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span
                className={`${styles.connector} ${isDone ? styles.connectorDone : ""}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
