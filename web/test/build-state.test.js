const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createBuildState,
} = require("../public/js/build-state.js");

test("initial state starts empty before a project prompt", () => {
  const state = createBuildState();

  assert.equal(state.state.overallProgress, 0);
  assert.equal(state.state.activeStepId, null);
  assert.equal(state.state.steps.length, 0);
  assert.equal(state.state.buildStatus, "Tell Archie what to build");
});

test("setTaskPlan clones task steps and recalculates overall progress", () => {
  const state = createBuildState();
  const steps = [
    {
      id: "review-plan",
      label: "Review Haunted House",
      progress: 5,
      status: "active",
      detail: "Review the core loop.",
    },
    {
      id: "build-world",
      label: "Build the world",
      progress: 0,
      status: "upcoming",
      detail: "Nighttime, heavy fog.",
    },
  ];

  state.setTaskPlan(steps, {
    activeStepId: "review-plan",
    buildStatus: "Plan ready to review",
  });

  assert.equal(state.state.activeStepId, "review-plan");
  assert.equal(state.state.buildStatus, "Plan ready to review");
  assert.equal(state.state.overallProgress, 2.5);
  assert.notEqual(state.state.steps, steps);
  assert.equal(state.state.steps[0].label, "Review Haunted House");
});

test("updateStep changes one server-generated step and recalculates overall progress", () => {
  const state = createBuildState();
  state.setTaskPlan([
    {
      id: "review-plan",
      label: "Review Street Racer",
      progress: 5,
      status: "active",
      detail: "Review the plan.",
    },
    {
      id: "script-gameplay",
      label: "Script gameplay",
      progress: 0,
      status: "upcoming",
      detail: "Drive the car around the track.",
    },
  ]);

  state.updateStep("review-plan", {
    status: "done",
    progress: 100,
    detail: "Ready",
  });

  assert.equal(state.state.steps[0].status, "done");
  assert.equal(state.state.steps[0].detail, "Ready");
  assert.equal(state.state.overallProgress, 50);
});

test("reset returns the state to the pre-project values", () => {
  const state = createBuildState();

  state.setTaskPlan([
    {
      id: "place-objects",
      label: "Place key objects",
      progress: 0,
      status: "upcoming",
      detail: "Castle, lava, checkpoints.",
    },
  ]);
  state.update({
    avatarState: "speaking",
    buildStatus: "Working",
    activeStepId: "place-objects",
  });
  state.updateStep("place-objects", {
    status: "active",
    progress: 80,
    detail: "Adding props",
  });

  state.reset();

  assert.equal(state.state.avatarState, "idle");
  assert.equal(state.state.buildStatus, "Tell Archie what to build");
  assert.equal(state.state.activeStepId, null);
  assert.deepEqual(state.state.steps, []);
});
