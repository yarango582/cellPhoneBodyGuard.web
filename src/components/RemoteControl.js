import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const RemoteControl = ({ deviceId }) => {
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("control");
  const [confirmAction, setConfirmAction] = useState(null);
  const [securityKey, setSecurityKey] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!auth.currentUser || !deviceId) return;

      try {
        // Obtener datos del dispositivo
        const deviceDoc = await getDoc(doc(db, "devices", deviceId));

        if (deviceDoc.exists()) {
          setDevice(deviceDoc.data());
        } else {
          // Obtener datos del usuario como fallback
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Crear objeto de dispositivo con la información del usuario
            const deviceData = {
              id: deviceId,
              userId: auth.currentUser.uid,
              name: userData.deviceInfo?.name || "Mi dispositivo",
              status: {
                isBlocked: userData.deviceBlocked || false,
                blockedAt: userData.blockedAt,
                blockReason: userData.blockReason,
              },
              deviceInfo: userData.deviceInfo || {
                brand: "Desconocido",
                modelName: "Desconocido",
                osName: "Android",
                osVersion: "Desconocido",
              },
              lastOnline: userData.lastActivity,
              registeredAt: userData.createdAt,
            };

            setDevice(deviceData);
          }
        }

        // Obtener historial de comandos
        const commandsQuery = query(
          collection(db, "remoteCommands"),
          where("deviceId", "==", deviceId),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const commandsSnapshot = await getDocs(commandsQuery);
        const commandsList = [];

        commandsSnapshot.forEach((doc) => {
          commandsList.push({ id: doc.id, ...doc.data() });
        });

        setCommandHistory(commandsList);
      } catch (error) {
        console.error("Error al cargar datos del dispositivo:", error);
      }
    };

    fetchDeviceData();
  }, [auth.currentUser, deviceId, db]);

  // Función para enviar comandos remotos
  const sendRemoteCommand = async (commandType, params = {}) => {
    if (!device || loading) return;

    try {
      setLoading(true);

      // Crear el comando remoto
      const command = {
        type: commandType,
        deviceId: deviceId,
        userId: auth.currentUser.uid,
        status: "pending",
        createdAt: Date.now(),
        params: params,
      };

      // Guardar el comando en Firestore
      const commandRef = await addDoc(collection(db, "remoteCommands"), {
        ...command,
        createdAt: serverTimestamp(),
      });

      // Registrar el evento
      await addDoc(collection(db, "securityEvents"), {
        type: "remote_command",
        description: `Comando remoto enviado: ${commandType}`,
        timestamp: Date.now(),
        deviceId: deviceId,
        userId: auth.currentUser.uid,
        severity: "high",
        details: { commandId: commandRef.id, commandType, params },
      });

      // Actualizar la interfaz de usuario
      setCommandHistory([{ id: commandRef.id, ...command }, ...commandHistory]);

      // Si es un comando de bloqueo, actualizar el estado local
      if (commandType === "lock") {
        setDevice({
          ...device,
          status: {
            ...device.status,
            isBlocked: true,
            blockedAt: new Date().toISOString(),
          },
        });

        // También actualizar el documento del usuario
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          deviceBlocked: true,
          blockedAt: serverTimestamp(),
          blockReason: "remote_lock",
          lastActivity: serverTimestamp(),
        });
      }

      // Si es un comando de desbloqueo, actualizar el estado local
      if (commandType === "unlock") {
        setDevice({
          ...device,
          status: {
            ...device.status,
            isBlocked: false,
          },
        });

        // También actualizar el documento del usuario
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          deviceBlocked: false,
          unblockedAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
        });
      }

      // Resetear estado
      setConfirmAction(null);
      setSecurityKey("");

      return true;
    } catch (error) {
      console.error("Error al enviar comando remoto:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Manejar confirmación de acción
  const handleConfirmAction = (action) => {
    setConfirmAction(action);
  };

  // Manejar envío de acción después de confirmación
  const handleExecuteAction = async () => {
    if (!confirmAction) return;

    const params = {};

    // Si es una acción de desbloqueo y tenemos clave, incluirla
    if (confirmAction === "unlock" && securityKey) {
      params.securityKey = securityKey.replace(/\s/g, ""); // Eliminar espacios
    }

    const success = await sendRemoteCommand(confirmAction, params);

    if (success) {
      alert(`Comando ${getCommandName(confirmAction)} enviado exitosamente.`);
    } else {
      alert("Error al enviar comando. Inténtalo de nuevo.");
    }
  };

  // Obtener nombre legible del comando
  const getCommandName = (commandType) => {
    switch (commandType) {
      case "lock":
        return "Bloquear dispositivo";
      case "unlock":
        return "Desbloquear dispositivo";
      case "locate":
        return "Localizar dispositivo";
      case "wipe":
        return "Borrar datos";
      default:
        return commandType;
    }
  };

  // Obtener color según el estado del comando
  const getCommandStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFC107"; // Amarillo
      case "executing":
        return "#2196F3"; // Azul
      case "executed":
        return "#4CAF50"; // Verde
      case "failed":
        return "#F44336"; // Rojo
      default:
        return "#9E9E9E"; // Gris
    }
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date =
      typeof timestamp === "object" && timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString();
  };

  // Contenido según el tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case "control":
        return (
          <ControlPanel>
            <ControlHeader>
              <h3>Panel de control remoto</h3>
              <DeviceStatus blocked={device?.status?.isBlocked}>
                {device?.status?.isBlocked ? "Bloqueado" : "Desbloqueado"}
              </DeviceStatus>
            </ControlHeader>

            <ActionButtonsContainer>
              <ActionButton
                color="#F44336"
                disabled={device?.status?.isBlocked || loading}
                onClick={() => handleConfirmAction("lock")}
              >
                <ActionIcon>
                  <LockIcon />
                </ActionIcon>
                <ActionText>Bloquear</ActionText>
              </ActionButton>

              <ActionButton
                color="#4CAF50"
                disabled={!device?.status?.isBlocked || loading}
                onClick={() => handleConfirmAction("unlock")}
              >
                <ActionIcon>
                  <UnlockIcon />
                </ActionIcon>
                <ActionText>Desbloquear</ActionText>
              </ActionButton>

              <ActionButton
                color="#2196F3"
                disabled={loading}
                onClick={() => handleConfirmAction("locate")}
              >
                <ActionIcon>
                  <LocationIcon />
                </ActionIcon>
                <ActionText>Localizar</ActionText>
              </ActionButton>

              <ActionButton
                color="#FF5722"
                disabled={loading}
                onClick={() => handleConfirmAction("wipe")}
              >
                <ActionIcon>
                  <WipeIcon />
                </ActionIcon>
                <ActionText>Borrar datos</ActionText>
              </ActionButton>
            </ActionButtonsContainer>

            {device?.status?.isBlocked && (
              <BlockedInfo>
                <p>
                  <strong>Bloqueado desde:</strong>{" "}
                  {formatDate(device.status.blockedAt)}
                </p>
                {device.status.blockReason && (
                  <p>
                    <strong>Razón:</strong> {device.status.blockReason}
                  </p>
                )}
              </BlockedInfo>
            )}

            {confirmAction && (
              <ConfirmationModal>
                <ConfirmationContent>
                  <h3>{getCommandName(confirmAction)}</h3>
                  <p>
                    ¿Estás seguro de que deseas{" "}
                    {getCommandName(confirmAction).toLowerCase()}?
                  </p>

                  {confirmAction === "unlock" && (
                    <SecurityKeyInput
                      placeholder="Clave de seguridad (20 dígitos)"
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value)}
                    />
                  )}

                  {confirmAction === "wipe" && (
                    <WarningText>
                      ¡ADVERTENCIA! Esta acción borrará todos los datos del
                      dispositivo y no se puede deshacer.
                    </WarningText>
                  )}

                  <ConfirmationButtons>
                    <ConfirmButton
                      onClick={handleExecuteAction}
                      disabled={
                        loading ||
                        (confirmAction === "unlock" &&
                          securityKey.replace(/\s/g, "").length !== 20)
                      }
                    >
                      {loading ? "Enviando..." : "Confirmar"}
                    </ConfirmButton>
                    <CancelButton
                      onClick={() => setConfirmAction(null)}
                      disabled={loading}
                    >
                      Cancelar
                    </CancelButton>
                  </ConfirmationButtons>
                </ConfirmationContent>
              </ConfirmationModal>
            )}
          </ControlPanel>
        );

      case "history":
        return (
          <HistoryPanel>
            <h3>Historial de comandos</h3>

            {commandHistory.length === 0 ? (
              <EmptyState>
                <p>No hay comandos en el historial</p>
              </EmptyState>
            ) : (
              <CommandList>
                {commandHistory.map((command) => (
                  <CommandItem key={command.id}>
                    <CommandHeader>
                      <CommandType>{getCommandName(command.type)}</CommandType>
                      <CommandStatus
                        color={getCommandStatusColor(command.status)}
                      >
                        {command.status}
                      </CommandStatus>
                    </CommandHeader>
                    <CommandInfo>
                      <CommandInfoItem>
                        <strong>Enviado:</strong>{" "}
                        {formatDate(command.createdAt)}
                      </CommandInfoItem>
                      {command.executedAt && (
                        <CommandInfoItem>
                          <strong>Ejecutado:</strong>{" "}
                          {formatDate(command.executedAt)}
                        </CommandInfoItem>
                      )}
                      {command.result && (
                        <CommandInfoItem>
                          <strong>Resultado:</strong>{" "}
                          {command.result.success ? "Exitoso" : "Fallido"}
                          {command.result.error && ` - ${command.result.error}`}
                        </CommandInfoItem>
                      )}
                    </CommandInfo>
                  </CommandItem>
                ))}
              </CommandList>
            )}
          </HistoryPanel>
        );

      default:
        return null;
    }
  };

  return (
    <RemoteControlContainer>
      <TabsContainer>
        <Tab
          active={activeTab === "control"}
          onClick={() => setActiveTab("control")}
        >
          Panel de control
        </Tab>
        <Tab
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Historial
        </Tab>
      </TabsContainer>

      {device ? (
        renderTabContent()
      ) : (
        <LoadingContainer>
          <LoadingSpinner />
          <p>Cargando datos del dispositivo...</p>
        </LoadingContainer>
      )}
    </RemoteControlContainer>
  );
};

// Estilos
const RemoteControlContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  margin-bottom: 20px;
  overflow: hidden;
`;

const TabsContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.light};
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.div`
  padding: 15px 20px;
  cursor: pointer;
  font-weight: ${({ active }) => (active ? "600" : "400")};
  color: ${({ active, theme }) =>
    active ? theme.colors.primary : theme.colors.secondary};
  border-bottom: ${({ active, theme }) =>
    active ? `2px solid ${theme.colors.primary}` : "none"};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const ControlPanel = styled.div`
  padding: 20px;
`;

const ControlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const DeviceStatus = styled.div`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  background-color: ${({ blocked, theme }) =>
    blocked ? theme.colors.danger : theme.colors.success};
  color: white;
  font-weight: 500;
`;

const ActionButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 8px;
  background-color: ${({ color }) => `${color}10`};
  border: 1px solid ${({ color }) => `${color}30`};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ color, disabled }) => !disabled && `${color}20`};
    transform: ${({ disabled }) => !disabled && "translateY(-2px)"};
  }
`;

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 10px;
`;

const ActionText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const BlockedInfo = styled.div`
  background-color: ${({ theme }) => `${theme.colors.danger}10`};
  border-left: 3px solid ${({ theme }) => theme.colors.danger};
  padding: 10px 15px;
  margin-bottom: 20px;
  border-radius: 4px;

  p {
    margin: 5px 0;
    font-size: 14px;
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ConfirmationContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    color: ${({ theme }) => theme.colors.text};
  }

  p {
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 20px;
  }
`;

const SecurityKeyInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 20px;
  letter-spacing: 2px;
  text-align: center;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

const WarningText = styled.p`
  color: ${({ theme }) => theme.colors.danger} !important;
  font-weight: 500;
  text-align: center;
`;

const ConfirmationButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ConfirmButton = styled.button`
  padding: 8px 15px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ theme, disabled }) =>
      !disabled && theme.colors.primary + "dd"};
  }
`;

const CancelButton = styled.button`
  padding: 8px 15px;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ theme, disabled }) =>
      !disabled && theme.colors.light};
  }
`;

const HistoryPanel = styled.div`
  padding: 20px;

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const CommandList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CommandItem = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 8px;
  padding: 15px;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
`;

const CommandHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const CommandType = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const CommandStatus = styled.span`
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  color: white;
  background-color: ${({ color }) => color};
`;

const CommandInfo = styled.div`
  font-size: 14px;
`;

const CommandInfoItem = styled.div`
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.secondary};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  color: ${({ theme }) => theme.colors.secondary};
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 8px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const LoadingSpinner = styled.div`
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  width: 30px;
  height: 30px;
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

// Iconos
const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      stroke="#F44336"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
      stroke="#F44336"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UnlockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      stroke="#4CAF50"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7"
      stroke="#4CAF50"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
      stroke="#2196F3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
      stroke="#2196F3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WipeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 6H5H21"
      stroke="#FF5722"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
      stroke="#FF5722"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 11V17"
      stroke="#FF5722"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 11V17"
      stroke="#FF5722"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default RemoteControl;
