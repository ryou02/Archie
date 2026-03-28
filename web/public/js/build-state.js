function cloneSteps(steps) {
  return (steps || []).map((step) => ({ ...step }));
}

function createBaseState() {
  return {
    avatarState: "idle",
    overallProgress: 0,
    activeStepId: null,
    buildStatus: "Tell Archie what to build",
    steps: [],
  };
}

function createBuildState() {
  return {
    state: createBaseState(),
    listeners: new Set(),

    subscribe(listener) {
      this.listeners.add(listener);
      listener(this.state);
      return () => this.listeners.delete(listener);
    },

    notify() {
      this.listeners.forEach((listener) => listener(this.state));
    },

    update(patch) {
      this.state = { ...this.state, ...patch };
      this.notify();
    },

    setTaskPlan(steps, patch = {}) {
      const nextSteps = cloneSteps(steps);
      const overallProgress =
        nextSteps.length > 0
          ? nextSteps.reduce((sum, step) => sum + step.progress, 0) / nextSteps.length
          : 0;

      this.update({
        steps: nextSteps,
        overallProgress,
        ...patch,
      });
    },

    updateStep(stepId, stepPatch) {
      const steps = this.state.steps.map((step) =>
        step.id === stepId ? { ...step, ...stepPatch } : step
      );
      const overallProgress =
        steps.length > 0
          ? steps.reduce((sum, step) => sum + step.progress, 0) / steps.length
          : 0;

      this.update({ steps, overallProgress });
    },

    reset() {
      this.state = createBaseState();
      this.notify();
    },
  };
}

const BuildState = createBuildState();

if (typeof window !== "undefined") {
  window.BuildState = BuildState;
}

if (typeof module !== "undefined") {
  module.exports = {
    BuildState,
    createBuildState,
  };
}
