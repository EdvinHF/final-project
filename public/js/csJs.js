function addPage() {
  const descriptionInput = document.getElementById("description-input");
  const description = descriptionInput.value;

  if (description !== "") {
    console.log(description);
  }
}

function loadHandler() {
  const addButton = document.getElementById("add-button");
  addButton.addEventListener("click", addPage);
}
window.addEventListener("load", loadHandler);
