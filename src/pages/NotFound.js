import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <NotFoundContainer>
      <NotFoundIcon />
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundText>Página no encontrada</NotFoundText>
      <NotFoundDescription>
        La página que estás buscando no existe o ha sido movida.
      </NotFoundDescription>
      <BackButton to="/">Volver al inicio</BackButton>
    </NotFoundContainer>
  );
};

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 0 20px;
`;

const NotFoundIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#6c757d"
    width="80"
    height="80"
    style={{ marginBottom: "20px" }}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

const NotFoundTitle = styled.h1`
  font-size: 72px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 10px;
`;

const NotFoundText = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 15px;
`;

const NotFoundDescription = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 30px;
  max-width: 500px;
`;

const BackButton = styled(Link)`
  display: inline-block;
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

export default NotFound;
