import { useMemo, useState } from "react";
import { createTrainingSession } from "../../lib/trainingSessions";
import ThemedMenuSelect from "./ThemedMenuSelect";

const sampleScenarios = [
  "Prospect says: Your pricing is too high compared to competitors.",
  "Prospect says: We need to think about this and come back next quarter.",
  "Prospect says: We already have a vendor and switching is risky."
];

export default function SessionComposer({ user, canCreate, onSessionCreated }) {
  const [closerName, setCloserName] = useState("");
  const [goal, setGoal] = useState("");
  const [scenario, setScenario] = useState(sampleScenarios[0]);
  const scenarioOptions = useMemo(
    () => sampleScenarios.map((s) => ({ value: s, label: s })),
    [],
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleCreateSession(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const session = await createTrainingSession({
        userId: user.id,
        closerName,
        goal,
        scenario
      });
      onSessionCreated(session);
      setGoal("");
      setMessage("Session created successfully.");
    } catch (sessionError) {
      setError(sessionError.message);
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <section className="db-panel db-create-panel">
        <h3>Create Session</h3>
        <p>You have viewer access. Ask an admin to upgrade your role to editor.</p>
      </section>
    );
  }

  return (
    <section className="db-panel db-create-panel">
      <h3>Create Session</h3>
      <form className="db-create-form" onSubmit={handleCreateSession}>
        <input
          type="text"
          placeholder="Closer name"
          value={closerName}
          onChange={(event) => setCloserName(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Training goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          required
        />
        <ThemedMenuSelect
          className="db-create-scenario-select"
          value={scenario}
          onChange={setScenario}
          options={scenarioOptions}
          ariaLabel="Training scenario"
        />
        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Training Session"}
        </button>
      </form>
      {message ? <p className="db-create-success">{message}</p> : null}
      {error ? <p className="db-create-error">{error}</p> : null}
    </section>
  );
}
