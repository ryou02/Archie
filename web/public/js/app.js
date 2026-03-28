document.addEventListener("DOMContentLoaded", () => {
  TaskPanel.init();
  Chat.init();
  VoiceOutput.init();
  VoiceInput.init();

  BuildState.update({
    avatarState: "idle",
    buildStatus: "Tell Archie what to build",
  });

  const waitForScenes = setInterval(() => {
    if (window.Avatar && window.Diorama) {
      clearInterval(waitForScenes);
      window.Avatar.init();
      window.Avatar.setState("idle");
      window.Diorama.init();
    }
  }, 50);

  Chat.onUserMessageStart = (text) => {
    if (window.Avatar) {
      window.Avatar.setState("thinking");
    }
    beginBuildFlow(text);
  };

  Chat.onRequestSuccess = ({ speech }) => {
    moveBuildFlowForward(speech);
  };

  Chat.onRequestError = () => {
    if (window.Avatar) {
      window.Avatar.setState("idle");
    }
    BuildState.update({
      avatarState: "idle",
      buildStatus: "Something went wrong. Try again.",
      activeStepId: "plan",
    });
    BuildState.updateStep("plan", {
      status: "active",
      progress: 20,
      detail: "Let's try that one more time.",
    });
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
      buildStatus: "Explaining the build",
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
      buildStatus: "Ready for the next idea",
    });
    BuildState.updateStep("polish", {
      status: "done",
      progress: 100,
      detail: "Everything is ready to show.",
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

function beginBuildFlow(text) {
  BuildState.reset();
  BuildState.update({
    avatarState: "thinking",
    activeStepId: "plan",
    buildStatus: "Planning the build",
  });
  BuildState.updateStep("plan", {
    status: "active",
    progress: 42,
    detail: `Thinking about ${summarizeTopic(text)}.`,
  });
  BuildState.updateStep("scene", {
    status: "upcoming",
    progress: 0,
    detail: "",
  });
  BuildState.updateStep("objects", {
    status: "upcoming",
    progress: 0,
    detail: "",
  });
  BuildState.updateStep("polish", {
    status: "upcoming",
    progress: 0,
    detail: "",
  });
}

function moveBuildFlowForward(speech) {
  BuildState.update({
    activeStepId: "objects",
    buildStatus: "Building the preview",
  });
  BuildState.updateStep("plan", {
    status: "done",
    progress: 100,
    detail: "The idea is locked in.",
  });
  BuildState.updateStep("scene", {
    status: "done",
    progress: 100,
    detail: "The world is set up.",
  });
  BuildState.updateStep("objects", {
    status: "active",
    progress: 76,
    detail: clipDetail(speech, "Adding the main pieces now."),
  });
  BuildState.updateStep("polish", {
    status: "active",
    progress: 48,
    detail: "Wrapping up the final details.",
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
