import React from "react";
import styled, { keyframes } from "styled-components";

const LoadingScreen = () => {
  return (
    <LoadingContainer>
      <LoadingIcon>
        <Shield />
        <Spinner />
      </LoadingIcon>
      <LoadingText>Cargando SecureWipe...</LoadingText>
    </LoadingContainer>
  );
};

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${({ theme }) => theme?.colors?.background || "#F8F9FA"};
`;

const LoadingIcon = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
`;

const Shield = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme?.colors?.primary || "#007BFF"};
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E")
    no-repeat center / contain;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E")
    no-repeat center / contain;
  animation: ${pulse} 2s infinite ease-in-out;
`;

const Spinner = styled.div`
  position: absolute;
  top: -10px;
  left: -10px;
  width: 100px;
  height: 100px;
  border: 3px solid transparent;
  border-top: 3px solid ${({ theme }) => theme?.colors?.info || "#17A2B8"};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme?.colors?.text || "#333333"};
`;

export default LoadingScreen;
