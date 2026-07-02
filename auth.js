var currentUser = null;
var unsubscribeSnapshot = null;

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("authTabLogin").addEventListener("click", function() { cambiarAuthTab('login'); });
  document.getElementById("authTabRegistro").addEventListener("click", function() { cambiarAuthTab('registro'); });
  document.getElementById("btnLogin").addEventListener("click", hacerLogin);
  document.getElementById("btnRegistro").addEventListener("click", hacerRegistro);
  document.getElementById("btnLogout").addEventListener("click", hacerLogout);

  ["loginEmail", "loginPassword"].forEach(function(id) {
    document.getElementById(id).addEventListener("keydown", function(e) { if (e.key === "Enter") hacerLogin(); });
  });
  ["regNombre", "regEmail", "regPassword", "regPassword2"].forEach(function(id) {
    document.getElementById(id).addEventListener("keydown", function(e) { if (e.key === "Enter") hacerRegistro(); });
  });

  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      document.getElementById("authScreen").style.display = "none";
      document.getElementById("appScreen").style.display = "block";
      actualizarUIUsuario(user);
      suscribirDatos(user.uid);
    } else {
      currentUser = null;
      if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
      document.getElementById("authScreen").style.display = "flex";
      document.getElementById("appScreen").style.display = "none";
      limpiarFormulariosAuth();
    }
  });
});

// Nombre a mostrar: usa el nombre elegido al registrarse (guardado como
// displayName en Firebase Auth). Si por algún motivo no está disponible
// (ej. cuentas creadas antes de este cambio), cae al usuario del email.
function nombreParaMostrar(user) {
  var nombre = (user.displayName || "").trim();
  if (nombre) return nombre;
  return user.email ? user.email.split("@")[0] : "Usuario";
}

// Actualiza el saludo del inicio, el nombre de marca en la barra superior
// y la inicial del chip de usuario. Se llama tanto al iniciar sesión como
// justo después de crear una cuenta nueva.
function actualizarUIUsuario(user) {
  var mostrar = nombreParaMostrar(user);

  document.getElementById("userEmailLabel").textContent = user.email;

  var chipInicial = document.getElementById("userChipInicial");
  if (chipInicial) chipInicial.textContent = mostrar.charAt(0).toUpperCase();

  var saludo = document.getElementById("saludoUsuario");
  if (saludo) saludo.textContent = "Qué bueno volver a verte, " + mostrar;

  var brand = document.getElementById("brandName");
  if (brand) {
    brand.textContent = "";
    brand.appendChild(document.createTextNode("Finanzas "));
    var em = document.createElement("em");
    em.textContent = mostrar;
    brand.appendChild(em);
  }
}

function limpiarFormulariosAuth() {
  ["loginEmail", "loginPassword", "regNombre", "regEmail", "regPassword", "regPassword2"].forEach(function(id) {
    document.getElementById(id).value = "";
  });
  document.getElementById("authError").textContent = "";
}

function cambiarAuthTab(tab) {
  document.getElementById("authTabLogin").classList.toggle("active", tab === "login");
  document.getElementById("authTabRegistro").classList.toggle("active", tab === "registro");
  document.getElementById("formLogin").style.display = tab === "login" ? "block" : "none";
  document.getElementById("formRegistro").style.display = tab === "registro" ? "block" : "none";
  document.getElementById("authError").textContent = "";
}

function mostrarErrorAuth(err) {
  var mensajes = {
    "auth/email-already-in-use": "Ese email ya tiene una cuenta. Iniciá sesión.",
    "auth/invalid-email": "El email no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found": "No existe una cuenta con ese email.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en unos minutos.",
    "auth/network-request-failed": "Sin conexión a internet."
  };
  document.getElementById("authError").textContent = mensajes[err.code] || "Ocurrió un error. Intentá de nuevo.";
}

function hacerRegistro() {
  var nombre = document.getElementById("regNombre").value.trim();
  var email  = document.getElementById("regEmail").value.trim();
  var pass   = document.getElementById("regPassword").value;
  var pass2  = document.getElementById("regPassword2").value;
  var errEl  = document.getElementById("authError");
  errEl.textContent = "";

  if (!nombre || !email || !pass || !pass2) { errEl.textContent = "Completá todos los campos."; return; }
  if (nombre.length > 40) { errEl.textContent = "Usá un nombre más corto (máx. 40 caracteres)."; return; }
  if (pass.length < 6) { errEl.textContent = "La contraseña debe tener al menos 6 caracteres."; return; }
  if (pass !== pass2) { errEl.textContent = "Las contraseñas no coinciden."; return; }

  var btn = document.getElementById("btnRegistro");
  btn.disabled = true; btn.textContent = "Creando cuenta...";
  auth.createUserWithEmailAndPassword(email, pass)
    .then(function(cred) {
      return cred.user.updateProfile({ displayName: nombre }).then(function() {
        actualizarUIUsuario(auth.currentUser);
      });
    })
    .catch(mostrarErrorAuth)
    .finally(function() { btn.disabled = false; btn.textContent = "Crear cuenta"; });
}

function hacerLogin() {
  var email = document.getElementById("loginEmail").value.trim();
  var pass  = document.getElementById("loginPassword").value;
  var errEl = document.getElementById("authError");
  errEl.textContent = "";

  if (!email || !pass) { errEl.textContent = "Completá todos los campos."; return; }

  var btn = document.getElementById("btnLogin");
  btn.disabled = true; btn.textContent = "Ingresando...";
  auth.signInWithEmailAndPassword(email, pass)
    .catch(mostrarErrorAuth)
    .finally(function() { btn.disabled = false; btn.textContent = "Ingresar"; });
}

function hacerLogout() {
  if (!confirm("¿Cerrar sesión?")) return;
  auth.signOut();
}
