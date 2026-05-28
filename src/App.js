import { useState, useEffect } from "react";

const GREEN = "#1B4D2E";
const GOLD = "#F0C040";
const GOLD_DARK = "#C9982A";
const BG = "#12321E";
const CARD_BG = "#183D25";



const FONT_STYLE = {
  fontFamily: "'Special Elite', 'Georgia', serif",
  letterSpacing: "0.08em",
};

const ACIDIC = {
  fontFamily: "'Special Elite', 'Georgia', serif",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const DEMO_EVENTS = [
  {
    id: 1,
    title: "MAISON N°01",
    date: "14 Octobre 2023",
    location: "Silencio, Paris",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    password: "mdm01",
    photos: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
      "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&q=80",
      "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80",
    ],
    videos: [],
