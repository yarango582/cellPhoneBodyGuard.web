import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  getAuth,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("account");

  // Formularios
  const [accountForm, setAccountForm] = useState({
    displayName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    securityAlerts: true,
    deviceUpdates: true,
    marketingEmails: false,
  });

  const [securityForm, setSecurityForm] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        // Obtener perfil del usuario
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);

          // Inicializar formularios con datos existentes
          setAccountForm((prev) => ({
            ...prev,
            displayName: userData.displayName || "",
            email: auth.currentUser.email || "",
          }));

          if (userData.preferences) {
            setNotificationForm({
              emailNotifications:
                userData.preferences.emailNotifications ?? true,
              securityAlerts: userData.preferences.securityAlerts ?? true,
              deviceUpdates: userData.preferences.deviceUpdates ?? true,
              marketingEmails: userData.preferences.marketingEmails ?? false,
            });

            setSecurityForm({
              twoFactorAuth: userData.preferences.twoFactorAuth ?? false,
              sessionTimeout: userData.preferences.sessionTimeout ?? 30,
              loginNotifications:
                userData.preferences.loginNotifications ?? true,
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.currentUser, db]);

  // Manejadores de cambios en formularios
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));

    // Limpiar errores al cambiar un campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validación de formularios
  const validateAccountForm = () => {
    const newErrors = {};

    // Validar email si ha cambiado
    if (accountForm.email !== auth.currentUser.email) {
      if (!accountForm.email) {
        newErrors.email = "El email es obligatorio";
      } else if (!/\S+@\S+\.\S+/.test(accountForm.email)) {
        newErrors.email = "Email inválido";
      }

      if (!accountForm.currentPassword) {
        newErrors.currentPassword =
          "Se requiere la contraseña actual para cambiar el email";
      }
    }

    // Validar contraseña si se está cambiando
    if (accountForm.newPassword) {
      if (accountForm.newPassword.length < 6) {
        newErrors.newPassword =
          "La contraseña debe tener al menos 6 caracteres";
      }

      if (accountForm.newPassword !== accountForm.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }

      if (!accountForm.currentPassword) {
        newErrors.currentPassword =
          "Se requiere la contraseña actual para cambiar la contraseña";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar cambios
  const saveAccountChanges = async () => {
    if (!validateAccountForm()) return;

    setSaving(true);
    setSuccess("");

    try {
      const user = auth.currentUser;

      // Si hay cambios que requieren reautenticación
      if (
        (accountForm.email !== user.email || accountForm.newPassword) &&
        accountForm.currentPassword
      ) {
        const credential = EmailAuthProvider.credential(
          user.email,
          accountForm.currentPassword
        );

        await reauthenticateWithCredential(user, credential);

        // Actualizar email si ha cambiado
        if (accountForm.email !== user.email) {
          await updateEmail(user, accountForm.email);
        }

        // Actualizar contraseña si se ha proporcionado una nueva
        if (accountForm.newPassword) {
          await updatePassword(user, accountForm.newPassword);
        }
      }

      // Actualizar nombre de usuario
      if (accountForm.displayName !== userProfile.displayName) {
        await updateDoc(doc(db, "users", user.uid), {
          displayName: accountForm.displayName,
        });
      }

      // Limpiar campos de contraseña
      setAccountForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setSuccess("Cambios guardados correctamente");
    } catch (error) {
      console.error("Error al guardar cambios:", error);

      if (error.code === "auth/wrong-password") {
        setErrors((prev) => ({
          ...prev,
          currentPassword: "Contraseña incorrecta",
        }));
      } else if (error.code === "auth/email-already-in-use") {
        setErrors((prev) => ({ ...prev, email: "Este email ya está en uso" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Error al guardar cambios: " + error.message,
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPreferences = async () => {
    setSaving(true);
    setSuccess("");

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        "preferences.emailNotifications": notificationForm.emailNotifications,
        "preferences.securityAlerts": notificationForm.securityAlerts,
        "preferences.deviceUpdates": notificationForm.deviceUpdates,
        "preferences.marketingEmails": notificationForm.marketingEmails,
      });

      setSuccess("Preferencias de notificación guardadas");
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Error al guardar preferencias: " + error.message,
      }));
    } finally {
      setSaving(false);
    }
  };

  const saveSecurityPreferences = async () => {
    setSaving(true);
    setSuccess("");

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        "preferences.twoFactorAuth": securityForm.twoFactorAuth,
        "preferences.sessionTimeout": parseInt(securityForm.sessionTimeout),
        "preferences.loginNotifications": securityForm.loginNotifications,
      });

      setSuccess("Preferencias de seguridad guardadas");
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Error al guardar preferencias: " + error.message,
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    switch (activeTab) {
      case "account":
        saveAccountChanges();
        break;
      case "notifications":
        saveNotificationPreferences();
        break;
      case "security":
        saveSecurityPreferences();
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Cargando configuración...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <SettingsContainer>
      <PageHeader>
        <h1>Configuración</h1>
        <p>Administra tu cuenta y preferencias</p>
      </PageHeader>

      <SettingsContent>
        <SettingsSidebar>
          <SidebarItem
            active={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          >
            <AccountIcon />
            Cuenta
          </SidebarItem>
          <SidebarItem
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          >
            <NotificationIcon />
            Notificaciones
          </SidebarItem>
          <SidebarItem
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          >
            <SecurityIcon />
            Seguridad
          </SidebarItem>
        </SettingsSidebar>

        <SettingsPanel>
          {success && (
            <SuccessMessage>
              <SuccessIcon />
              {success}
            </SuccessMessage>
          )}

          {errors.general && (
            <ErrorMessage>
              <ErrorIcon />
              {errors.general}
            </ErrorMessage>
          )}

          <form onSubmit={handleSubmit}>
            {activeTab === "account" && (
              <>
                <SectionTitle>Información de la cuenta</SectionTitle>

                <FormGroup>
                  <Label htmlFor="displayName">Nombre</Label>
                  <Input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={accountForm.displayName}
                    onChange={handleAccountChange}
                    placeholder="Tu nombre"
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={accountForm.email}
                    onChange={handleAccountChange}
                    placeholder="tu@email.com"
                    error={errors.email}
                  />
                  {errors.email && <ErrorText>{errors.email}</ErrorText>}
                </FormGroup>

                <Divider />

                <SectionTitle>Cambiar contraseña</SectionTitle>

                <FormGroup>
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={accountForm.currentPassword}
                    onChange={handleAccountChange}
                    placeholder="Introduce tu contraseña actual"
                    error={errors.currentPassword}
                  />
                  {errors.currentPassword && (
                    <ErrorText>{errors.currentPassword}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={accountForm.newPassword}
                    onChange={handleAccountChange}
                    placeholder="Nueva contraseña"
                    error={errors.newPassword}
                  />
                  {errors.newPassword && (
                    <ErrorText>{errors.newPassword}</ErrorText>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="confirmPassword">
                    Confirmar nueva contraseña
                  </Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={accountForm.confirmPassword}
                    onChange={handleAccountChange}
                    placeholder="Confirma tu nueva contraseña"
                    error={errors.confirmPassword}
                  />
                  {errors.confirmPassword && (
                    <ErrorText>{errors.confirmPassword}</ErrorText>
                  )}
                </FormGroup>
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <SectionTitle>Preferencias de notificaciones</SectionTitle>

                <CheckboxGroup>
                  <Checkbox
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={notificationForm.emailNotifications}
                    onChange={handleNotificationChange}
                  />
                  <CheckboxLabel htmlFor="emailNotifications">
                    <div>Notificaciones por email</div>
                    <div className="description">
                      Recibir notificaciones generales por email
                    </div>
                  </CheckboxLabel>
                </CheckboxGroup>

                <CheckboxGroup>
                  <Checkbox
                    id="securityAlerts"
                    name="securityAlerts"
                    checked={notificationForm.securityAlerts}
                    onChange={handleNotificationChange}
                  />
                  <CheckboxLabel htmlFor="securityAlerts">
                    <div>Alertas de seguridad</div>
                    <div className="description">
                      Recibir alertas sobre actividades sospechosas
                    </div>
                  </CheckboxLabel>
                </CheckboxGroup>

                <CheckboxGroup>
                  <Checkbox
                    id="deviceUpdates"
                    name="deviceUpdates"
                    checked={notificationForm.deviceUpdates}
                    onChange={handleNotificationChange}
                  />
                  <CheckboxLabel htmlFor="deviceUpdates">
                    <div>Actualizaciones de dispositivos</div>
                    <div className="description">
                      Recibir notificaciones sobre cambios en tus dispositivos
                    </div>
                  </CheckboxLabel>
                </CheckboxGroup>

                <CheckboxGroup>
                  <Checkbox
                    id="marketingEmails"
                    name="marketingEmails"
                    checked={notificationForm.marketingEmails}
                    onChange={handleNotificationChange}
                  />
                  <CheckboxLabel htmlFor="marketingEmails">
                    <div>Emails promocionales</div>
                    <div className="description">
                      Recibir información sobre nuevas características y ofertas
                    </div>
                  </CheckboxLabel>
                </CheckboxGroup>
              </>
            )}

            {activeTab === "security" && (
              <>
                <SectionTitle>Configuración de seguridad</SectionTitle>

                <CheckboxGroup>
                  <Checkbox
                    id="twoFactorAuth"
                    name="twoFactorAuth"
                    checked={securityForm.twoFactorAuth}
                    onChange={handleSecurityChange}
                  />
                  <CheckboxLabel htmlFor="twoFactorAuth">
                    <div>Autenticación de dos factores</div>
                    <div className="description">
                      Añade una capa adicional de seguridad a tu cuenta
                    </div>
                  </CheckboxLabel>
                </CheckboxGroup>

                <FormGroup>
                  <Label htmlFor="sessionTimeout">
                    Tiempo de inactividad (minutos)
                  </Label>
                  <Select
                    id="sessionTimeout"
                    name="sessionTimeout"
                    value={securityForm.sessionTimeout}
                    onChange={handleSecurityChange}
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="240">4 horas</option>
                  </Select>
                </FormGroup>

                <CheckboxGroup>
                  <Checkbox
                    id="loginNotifications"
                    name="loginNotifications"
                    checked={securityForm.loginNotifications}
                    onChange={handleSecurityChange}
                  />
                  <CheckboxLabel htmlFor="loginNotifications">
                    <div>Notificaciones de inicio de sesión</div>
                    <div className="description">
                      Recibir alertas cuando se inicie sesión en tu cuenta
                    </div>
                  </CheckboxLabel>
                </CheckboxGroup>

                <Divider />

                <SectionTitle>Clave de seguridad</SectionTitle>
                <SecurityKeyInfo>
                  <p>
                    Tu clave de seguridad es necesaria para desbloquear
                    dispositivos bloqueados remotamente.
                  </p>
                  <SecurityKeyButton>Ver clave de seguridad</SecurityKeyButton>
                </SecurityKeyInfo>
              </>
            )}

            <ButtonsContainer>
              <SaveButton type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </SaveButton>
            </ButtonsContainer>
          </form>
        </SettingsPanel>
      </SettingsContent>
    </SettingsContainer>
  );
};

// Estilos
const SettingsContainer = styled.div`
  padding: 20px;
`;

const PageHeader = styled.div`
  margin-bottom: 30px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 5px;
  }

  p {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const SettingsContent = styled.div`
  display: flex;
  gap: 30px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

const SettingsSidebar = styled.div`
  width: 250px;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    display: flex;
    overflow-x: auto;
    margin-bottom: 20px;
  }
`;

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  color: ${(props) =>
    props.active ? props.theme.colors.primary : props.theme.colors.text};
  background-color: ${(props) =>
    props.active ? props.theme.colors.primary + "15" : "transparent"};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.active
        ? props.theme.colors.primary + "15"
        : props.theme.colors.light};
  }

  svg {
    margin-right: 10px;
    width: 20px;
    height: 20px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-bottom: 0;
    white-space: nowrap;
  }
`;

const SettingsPanel = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid
    ${(props) => (props.error ? props.theme.colors.danger : "#ddd")};
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.error ? props.theme.colors.danger : props.theme.colors.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ErrorText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
  margin-top: 5px;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 30px 0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const Checkbox = styled.input.attrs({ type: "checkbox" })`
  margin-right: 10px;
  width: 18px;
  height: 18px;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  .description {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.secondary};
    margin-top: 3px;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #d4edda;
  border-radius: 4px;
  color: #155724;
  margin-bottom: 20px;

  svg {
    margin-right: 10px;
    width: 20px;
    height: 20px;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f8d7da;
  border-radius: 4px;
  color: #721c24;
  margin-bottom: 20px;

  svg {
    margin-right: 10px;
    width: 20px;
    height: 20px;
  }
`;

const SecurityKeyInfo = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  padding: 15px;

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 15px;
  }
`;

const SecurityKeyButton = styled.button`
  padding: 8px 15px;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + "10"};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.light};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.secondary};
`;

// Iconos
const AccountIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const NotificationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
  </svg>
);

const SecurityIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
);

const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

export default Settings;
