// Keeps Hana anonymous until the first-room introduction dialogue is completed.
// This layer only changes displayed identity; dialogue styling and scenario data stay intact.
(() => {
  function isHanaIdentified() {
    if (!firstRoomState) return false;
    if (typeof firstRoomState.hanaIntroduced === "boolean") return firstRoomState.hanaIntroduced;
    // Compatibility with saves created before hanaIntroduced was added.
    return Number(firstRoomState.hanaVisits || 0) > 0;
  }

  function displayName() {
    return isHanaIdentified() ? "ハナ" : "？？？";
  }

  function refreshIdentityUi() {
    const name = displayName();

    const bottomButton = document.getElementById("gameplayHanaButton");
    if (bottomButton) {
      bottomButton.textContent = name;
      bottomButton.setAttribute("aria-label", `${name}に話しかける`);
    }

    const roomButton = document.getElementById("hanaButton");
    if (roomButton) {
      roomButton.setAttribute("aria-label", `${name}に話しかける`);
      const label = roomButton.querySelector("span");
      if (label) label.textContent = name;
    }

    document.querySelectorAll(".hana-choice-speaker").forEach(element => {
      element.textContent = name;
    });
    document.querySelectorAll(".hana-choice-menu").forEach(element => {
      element.setAttribute("aria-label", `${name}に聞くことを選ぶ`);
    });
  }

  function maskEntry(entry) {
    if (!entry || isHanaIdentified() || entry.speaker !== "ハナ") return entry;
    return {...entry, speaker: "？？？"};
  }

  // LOG must not reveal her name before the introduction is completed.
  const originalList = GameLog.list.bind(GameLog);
  const originalEntryFor = GameLog.entryFor.bind(GameLog);
  GameLog.list = () => originalList().map(maskEntry);
  GameLog.entryFor = line => maskEntry(originalEntryFor(line));

  // gameplay-ui.js installs the bottom HUD inside showFirstRoom(). Refresh after it.
  const showFirstRoomBeforeIdentity = showFirstRoom;
  showFirstRoom = function (...args) {
    const result = showFirstRoomBeforeIdentity.apply(this, args);
    refreshIdentityUi();
    return result;
  };

  window.HanaIdentity = {
    isIdentified: isHanaIdentified,
    getName: displayName,
    refresh: refreshIdentityUi
  };
})();
