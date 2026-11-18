// ---------- settings ----------
// Agree on this address with your colleague (the Python backend).
// The table name from data-table in the HTML is added at the end, e.g. .../api/farm/animal_group
const API_URL = "http://localhost:5000/api/farm";

const tabs = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".form_card");


// ---------- 1. tabs: show one form at a time ----------
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    forms.forEach((f) => (f.hidden = true));

    tab.classList.add("active");
    document.getElementById(tab.dataset.form).hidden = false;
  });
});


// ---------- 2. small helpers ----------
// Today's date in the format the date input wants (YYYY-MM-DD), using local time.
function today() {
  return new Date().toLocaleDateString("sv-SE");
}

function setDefaults(form) {
  form.querySelectorAll('input[type="date"]').forEach((input) => {
    input.value = today();
  });
}

// Column rule: lowercase only, words joined with _ (never -).
function toSnakeCase(value) {
  return value
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// Show or hide the green / red message under the fields.
function showMessage(form, type, text) {
  const error = form.querySelector(".message_error");
  const ok = form.querySelector(".message_ok");

  error.hidden = true;
  ok.hidden = true;

  if (type === "error") {
    error.textContent = text;
    error.hidden = false;
  }
  if (type === "ok") {
    ok.textContent = text;
    ok.hidden = false;
  }
}

function setFieldError(form, name, text) {
  const input = form.querySelector(`[name="${name}"]`);
  if (!input) return;

  const field = input.closest(".field");
  field.classList.add("has_error");
  field.querySelector(".field_error").textContent = text;
}

function clearErrors(form) {
  form.querySelectorAll(".field").forEach((field) => {
    field.classList.remove("has_error");
    field.querySelector(".field_error").textContent = "";
  });
  showMessage(form, null);
}


// ---------- 3. check the inputs before sending ----------
function validate(form) {
  let valid = true;

  form.querySelectorAll("input").forEach((input) => {
    const value = input.value.trim();

    if (input.required && value === "") {
      setFieldError(form, input.name, input.name + " is required.");
      valid = false;
    } else if (input.type === "number" && value !== "" && !/^-?\d+$/.test(value)) {
      setFieldError(form, input.name, input.name + " must be a whole number.");
      valid = false;
    }
  });

  return valid;
}


// ---------- 4. turn the inputs into an object ----------
// The keys are the column names, because every input has name="column_name".
// Empty optional fields become null, numbers become real numbers.
function readForm(form) {
  const data = {};

  form.querySelectorAll("input").forEach((input) => {
    const value = input.value.trim();

    if (value === "") {
      data[input.name] = null;
    } else if (input.type === "number") {
      data[input.name] = Number(value);
    } else {
      data[input.name] = value;
    }
  });

  return data;
}


// ---------- 5. send it to the backend ----------
async function handleSubmit(form) {
  clearErrors(form);

  if (!validate(form)) {
    showMessage(form, "error", "Fix the highlighted fields, then save again.");
    return;
  }

  const table = form.dataset.table;
  const data = readForm(form);
  console.log("sending to", table, data);

  try {
    const response = await fetch(`${API_URL}/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // If the backend answers with something that is not JSON, use an empty object.
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      form.reset();
      showMessage(form, "ok", `Record received for ${table}. It will be added to the database tomorrow at 09:00.`);
    } else {
      if (result.field) {
        setFieldError(form, result.field, result.message);
      }
      showMessage(form, "error", result.message || "The server could not save the record.");
    }
  } catch (error) {
    // fetch fails like this when the backend is off, the address is wrong, or CORS blocks it
    showMessage(form, "error", "Could not reach the server. Check that the backend is running.");
  }
}


// ---------- 6. connect everything to the forms ----------
forms.forEach((form) => {
  setDefaults(form);

  // lowercase and underscores while the worker types (text inputs only)
  form.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener("input", () => {
      input.value = toSnakeCase(input.value);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit(form);
  });

  // reset empties the date too, so put today's date back
  form.addEventListener("reset", () => {
    setTimeout(() => setDefaults(form), 0);
  });

  // the Clear button also removes old errors
  form.querySelector(".button_secondary").addEventListener("click", () => {
    clearErrors(form);
  });
});