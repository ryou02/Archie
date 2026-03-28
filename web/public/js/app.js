document.addEventListener("DOMContentLoaded", () => {
  TaskPanel.init();
  Chat.init();
  VoiceOutput.init();
  VoiceInput.init();

  BuildState.update({
    avatarState: "idle",
    buildStatus: "Tell Archie what to build",
  });

  const waitForDiorama = setInterval(() => {
    if (window.Diorama) {
      clearInterval(waitForDiorama);
      window.Diorama.init();
    }
  }, 50);

  Chat.onUserMessageStart = (text) => {
    if (window.Avatar) {
      window.Avatar.setState("thinking");
    }
    beginPlanRequest(text);
  };

  Chat.onRequestSuccess = ({ response, speech }) => {
    syncTaskPlanFromResponse(response, speech);
  };

  Chat.onRequestError = () => {
    if (window.Avatar) {
      window.Avatar.setState("idle");
    }
    BuildState.update({
      avatarState: "idle",
      buildStatus: "Something went wrong. Try again.",
      activeStepId: BuildState.state.steps[0]?.id || null,
    });
    if (BuildState.state.steps.length) {
      BuildState.updateStep(BuildState.state.steps[0].id, {
        status: "active",
        progress: 0,
        detail: "Let's try that one more time.",
      });
    }
  };

  Chat.onArchieResponse = (speech) => {
    if (speech) {
      VoiceOutput.speak(speech);
    }
  };

  VoiceInput.onTranscript = (text) => {
    Chat.handleUserMessage(text);
  };

  VoiceOutput.onSpeechStart = () => {
    if (window.Avatar) {
      window.Avatar.setState("speaking");
    }
    BuildState.update({
      avatarState: "speaking",
      buildStatus: BuildState.state.steps.length ? BuildState.state.buildStatus : "Explaining the plan",
    });
  };

  VoiceOutput.onSpeechEnergy = (energy) => {
    if (window.Avatar) {
      window.Avatar.setSpeechEnergy(energy);
    }
  };

  VoiceOutput.onSpeechEnd = () => {
    if (window.Avatar) {
      window.Avatar.setState("idle");
      window.Avatar.setSpeechEnergy(0);
    }

    BuildState.update({
      avatarState: "idle",
      buildStatus: BuildState.state.buildStatus,
    });
  };

  const micBtn = document.getElementById("mic-btn");
  micBtn.addEventListener("mousedown", () => {
    VoiceInput.startRecording();
    micBtn.classList.add("recording");
    if (window.Avatar) {
      window.Avatar.setState("listening");
    }
    BuildState.update({ avatarState: "listening", buildStatus: "Listening to your idea" });
  });
  micBtn.addEventListener("mouseup", () => {
    VoiceInput.stopRecording();
    micBtn.classList.remove("recording");
    if (window.Avatar) {
      window.Avatar.setState("idle");
    }
  });
  micBtn.addEventListener("mouseleave", () => {
    VoiceInput.stopRecording();
    micBtn.classList.remove("recording");
    if (window.Avatar) {
      window.Avatar.setState("idle");
    }
  });

  // Archie greets the user on load
  fetch("/start", { method: "POST" })
    .then((res) => res.json())
    .then((data) => {
      if (data.speech) {
        Chat.addMessage("assistant", data.speech);
        VoiceOutput.speak(data.speech);
      }
    })
    .catch((err) => console.error("Start error:", err));

  console.log("Archie app initialized");
});

function beginPlanRequest(text) {
  if (!BuildState.state.steps.length) {
    BuildState.reset();
  }
  BuildState.update({
    avatarState: "thinking",
    buildStatus: `Planning ${summarizeTopic(text)}...`,
  });
}

function syncTaskPlanFromResponse(response, speech) {
  const taskPlan = response?.taskPlan || [];
  const planStatus = response?.plan?.status || null;

  if (!taskPlan.length) {
    BuildState.update({
      avatarState: "idle",
      buildStatus: speech ? clipDetail(speech, "Ready for the next idea") : "Ready for the next idea",
    });
    return;
  }

  const steps = taskPlan.map((step) => ({ ...step }));
  const firstStepId = steps[0]?.id || null;

  if (planStatus === "waiting_approval") {
    steps[0] = {
      ...steps[0],
      status: "active",
      progress: 5,
      detail: "Plan ready. Say go when it looks right.",
    };

    BuildState.setTaskPlan(steps, {
      avatarState: "idle",
      activeStepId: firstStepId,
      buildStatus: "Plan ready to review",
    });
    return;
  }

  if (planStatus === "building") {
    steps.forEach((step, index) => {
      if (index === 0) {
        step.status = "done";
        step.progress = 100;
        step.detail = "The plan is locked in.";
      } else if (index === 1) {
        step.status = "active";
        step.progress = 24;
        step.detail = clipDetail(speech, step.detail);
      }
    });

    BuildState.setTaskPlan(steps, {
      avatarState: "idle",
      activeStepId: steps[1]?.id || firstStepId,
      buildStatus: "Building the game",
    });
    return;
  }

  BuildState.setTaskPlan(steps, {
    avatarState: "idle",
    activeStepId: firstStepId,
    buildStatus: "Tracking the build",
  });
}

function summarizeTopic(text) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return "your build";
  }

  return cleaned.length > 28 ? `${cleaned.slice(0, 28).trim()}...` : cleaned;
}

function clipDetail(text, fallback) {
  const cleaned = (text || "").trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return fallback;
  }

  return cleaned.length > 52 ? `${cleaned.slice(0, 52).trim()}...` : cleaned;
}
