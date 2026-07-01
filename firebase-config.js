// ============================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================
// 1. Andá a https://console.firebase.google.com
// 2. Creá un proyecto nuevo (gratis)
// 3. Dentro del proyecto: "Compilación" > "Authentication" > "Comenzar"
//    → habilitá el proveedor "Correo electrónico/contraseña"
// 4. Dentro del proyecto: "Compilación" > "Firestore Database" > "Crear base de datos"
//    → elegí modo "producción" y la región más cercana
// 5. Andá a "Configuración del proyecto" (ícono de tuerca) > "Tus apps"
//    → creá una app web (ícono </>) y copiá el objeto firebaseConfig
// 6. Pegá esos valores acá abajo, reemplazando los TU_... de ejemplo
// 7. En Authentication > Settings > Authorized domains, agregá el dominio
//    donde publiques la app (ej: tuusuario.github.io)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDf5d1_YkU3P41QNQBNa21JsRpKuXt5m8g",
  authDomain: "alkaranta-finanzas.firebaseapp.com",
  projectId: "alkaranta-finanzas",
  storageBucket: "alkaranta-finanzas.firebasestorage.app",
  messagingSenderId: "342752705000",
  appId: "1:342752705000:web:c296aa6515d84ab1eccc5d"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Persistencia offline: permite seguir usando la app sin conexión
// y sincroniza automáticamente cuando vuelve la señal.
db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
  if (err.code === 'failed-precondition') {
    console.warn("Persistencia offline: solo se puede activar en una pestaña a la vez.");
  } else if (err.code === 'unimplemented') {
    console.warn("Este navegador no soporta persistencia offline.");
  }
});
