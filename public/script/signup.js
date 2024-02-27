// DOM
const discordTokenEl = document.querySelector('.discordToken');
const signupForm = document.querySelector('.signup-form');

// Variables
const discordToken = discordTokenEl.getAttribute('token');

// functions
function formDataToObject(formData) {
  const object = {};
  formData.forEach((value, key) => {
    // If the key already exists, convert it into an array
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      if (!Array.isArray(object[key])) {
        object[key] = [object[key]];
      }
      object[key].push(value);
    } else {
      object[key] = value;
    }
  });
  return object;
}

// event listeners
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formObject = formDataToObject(new FormData(signupForm));
  formObject.id = discordToken;

  try {
    const response = await fetch(`/api/v1/users/signup`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(formObject),
    });

    const body = await response.json();

    if (body.status !== 'success') throw new Error(body.message);

    alert("You can get back to discord, you're logged in!");
  } catch (e) {
    alert(e.message);
  }
});
