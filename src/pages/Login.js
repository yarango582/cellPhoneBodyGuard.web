import React, { useState } from "react";
import styled from "styled-components";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Error de inicio de sesión:", error);

      switch (error.code) {
        case "auth/invalid-email":
          setError("Correo electrónico inválido");
          break;
        case "auth/user-not-found":
          setError("No existe una cuenta con este correo electrónico");
          break;
        case "auth/wrong-password":
          setError("Contraseña incorrecta");
          break;
        case "auth/too-many-requests":
          setError("Demasiados intentos fallidos. Intenta más tarde");
          break;
        default:
          setError("Error al iniciar sesión. Intenta de nuevo");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <ShieldIconContainer>
            <ShieldIcon />
          </ShieldIconContainer>
          <LogoText>SecureWipe</LogoText>
        </LogoContainer>

        <Title>Panel Administrativo</Title>
        <Subtitle>Inicia sesión para gestionar tus dispositivos</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <LoginForm onSubmit={handleLogin}>
          <FormGroup>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
            />
          </FormGroup>

          <ForgotPassword>¿Olvidaste tu contraseña?</ForgotPassword>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </SubmitButton>
        </LoginForm>

        <InfoText>
          Esta es la interfaz administrativa para gestionar dispositivos
          protegidos con SecureWipe. Si no tienes una cuenta, descarga la
          aplicación móvil para registrarte.
        </InfoText>
      </LoginCard>
    </LoginContainer>
  );
};

// Estilos
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 450px;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const ShieldIconContainer = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 10px;
  color: ${({ theme }) => theme.colors.primary};

  svg {
    width: 100%;
    height: 100%;
  }
`;

const LogoText = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.secondary};
  text-align: center;
  margin-bottom: 30px;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger + "20"};
  color: ${({ theme }) => theme.colors.danger};
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

const LoginForm = styled.form`
  margin-bottom: 30px;
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
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

const ForgotPassword = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary};
  text-align: right;
  margin-bottom: 20px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + "dd"};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  text-align: center;
  line-height: 1.5;
`;

// Componente de icono
const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
);

export default Login;
