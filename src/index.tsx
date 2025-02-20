import React, { useEffect, useState } from 'react'
import { type FC } from 'react'

import { Retool } from '@tryretool/custom-component-support'

export const ChatComponent: FC = () => {
  const [websocketUrl, _setwebsocketUrl] = Retool.useStateString({
    name: 'Websocket URL'
  })

  const [userName, _setUserName] = Retool.useStateString({
    name: 'userName'
  })
  
  const [messages, setMessages] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const createWebSocketConnection = () => {
    if (!websocketUrl) {
      console.log("No hay URL de WebSocket configurada");
      return null;
    }

    console.log("Conectando a WebSocket:", websocketUrl);
    const socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
      console.log("Conexión WebSocket establecida");
    };

    socket.onmessage = (event) => {
      console.log("Mensaje recibido:", event.data);
      try {
        const newMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } catch (error) {
        console.error("Error al parsear mensaje:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
    };

    socket.onclose = () => {
      console.log("Conexión WebSocket cerrada");
      setWs(null);
    };

    return socket;
  };

  const onClick = Retool.useEventCallback({ name: "click" });

  const handleClick = () => {
    console.log("Botón clickeado!", websocketUrl);
    console.log("Mensajes actuales:", messages);
    onClick();
  };

  const sendMessage = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log("WebSocket no está conectado, intentando reconectar...");
      const newSocket = createWebSocketConnection();
      if (newSocket) {
        setWs(newSocket);
        newSocket.onopen = () => {
          const message = {
            type: "message",
            content: "Hola desde Retool!",
            timestamp: new Date().toISOString()
          };
          newSocket.send(JSON.stringify(message));
          console.log("Mensaje enviado después de reconexión:", message);
        };
      }
    } else {
      const message = {
        type: "message",
        content: "Hola desde Retool!",
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(message));
      console.log("Mensaje enviado:", message);
    }
  };

  // Nueva función para enviar mensaje de despedida
  const sendGoodbyeMessage = (socket: WebSocket) => {
    if (socket.readyState === WebSocket.OPEN) {
      const goodbyeMessage = {
        type: "disconnect",
        content: `${userName || 'Usuario'} se ha desconectado`,
        timestamp: new Date().toISOString()
      };
      socket.send(JSON.stringify(goodbyeMessage));
      console.log("Mensaje de despedida enviado:", goodbyeMessage);
    }
  };

  useEffect(() => {
    const socket = createWebSocketConnection();
    if (socket) {
      setWs(socket);
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log("Ventana cerrándose, enviando mensaje de despedida");
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Enviamos el mensaje de despedida
        sendGoodbyeMessage(socket);
        // Damos un pequeño tiempo para que el mensaje se envíe antes de cerrar
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Pequeña espera para asegurar el envío del mensaje
        }
        socket.close();
      }
      // Para algunos navegadores
      event.preventDefault();
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socket) {
        console.log("Componente desmontándose, enviando mensaje de despedida");
        sendGoodbyeMessage(socket);
        socket.close();
      }
    };
  }, [websocketUrl, userName]); // Agregamos userName a las dependencias

  return (
    <div>
      <div>Hello World to {userName}!</div>
      <div>
        <button onClick={handleClick}>A button</button>
        <button onClick={sendMessage}>Enviar Mensaje</button>
      </div>
      <div>
        <h3>Mensajes recibidos:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{JSON.stringify(msg)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}