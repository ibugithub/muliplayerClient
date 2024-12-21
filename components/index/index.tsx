"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
  position: { x: number; y: number };
  name: string;
  color: string;
}

export const TestSocketClient = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const newSocket = io("http://localhost:3003");
    setSocket(newSocket);

    console.log("Client connected to server");

    // Handle current players event
    newSocket.on("current_players", (currentPlayers: Record<string, Player>) => {
      console.log("Current players:", currentPlayers);
      setPlayers(Object.values(currentPlayers));
    });

    // Handle new player event
    newSocket.on("new_player", (data: Player) => {
      console.log("New player joined:", data);
      setPlayers((prev) => [...prev, data]);
    });

    // Handle player movement event
    newSocket.on("update_position", (data: { id: string; position: { x: number; y: number } }) => {
      console.log("Player moved:", data);
      setPlayers((prev) =>
        prev.map((player) =>
          player.id === data.id ? { ...player, position: data.position } : player
        )
      );
    });

    // Handle player left event
    newSocket.on("player_left", (data: { id: string }) => {
      console.log("Player left:", data);
      setPlayers((prev) => prev.filter((player) => player.id !== data.id));
    });

    // Emit the 'player_joined' event when the component mounts
    const randomPosition = {
      x: Math.random() * 400,
      y: Math.random() * 400,
    };
    const playerName = `Player_${Math.floor(Math.random() * 1000)}`;
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    newSocket.emit("player_joined", { position: randomPosition, name: playerName, color: randomColor });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const drawPlayers = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each player as a rectangle with a name
    players.forEach((player) => {
      // Draw the box
      context.fillStyle = player.color;
      context.fillRect(player.position.x, player.position.y, 20, 20);

      // Draw the name above the box
      context.font = "12px Arial";
      context.textAlign = "center";
      context.fillText(
        player.name,
        player.position.x + 10,
        player.position.y - 5
      );
    });
  };

  useEffect(() => {
    drawPlayers();
  }, [players]);

  const handleMove = () => {
    if (socket) {
      const newPosition = {
        x: Math.random() * 400,
        y: Math.random() * 400,
      };
      setPlayers((prev) =>
        prev.map((player) =>
          player.id === socket.id ? { ...player, position: newPosition } : player
        )
      );
      socket.emit("player_moved", { position: newPosition });
      console.log("Player moved to:", newPosition);
    }
  };

  return (
    <div>
      <h1>Canvas Multiplayer</h1>
      <button onClick={handleMove}>Move Player</button>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{
          border: "1px solid black",
          marginTop: "20px",
        }}
      ></canvas>
    </div>
  );
};
