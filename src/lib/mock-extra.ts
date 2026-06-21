import { USERS } from "./mock-data";

export type Company = {
  id: string;
  name: string;
  category: string;
  city: string;
  logo: string;
};

const COMPANY_SEEDS: { name: string; category: string; city: string }[] = [
  { name: "Pizzaria Bella Massa", category: "Pizzaria", city: "São Paulo/SP" },
  { name: "Burger House 77", category: "Hamburgueria", city: "Rio de Janeiro/RJ" },
  { name: "Gelato Real", category: "Sorveteria", city: "Curitiba/PR" },
  { name: "Studio Glam", category: "Salão de Beleza", city: "Belo Horizonte/MG" },
  { name: "Iron Gym", category: "Academia", city: "Porto Alegre/RS" },
  { name: "AutoPrime Motors", category: "Concessionária", city: "Brasília/DF" },
  { name: "PhoneMaster", category: "Loja de Celulares", city: "Recife/PE" },
  { name: "GamerHub Store", category: "Loja Gamer", city: "Salvador/BA" },
  { name: "Arena Eventos", category: "Casa de Eventos", city: "Fortaleza/CE" },
  { name: "Urban Wear Co.", category: "Loja de Roupas", city: "Manaus/AM" },
  { name: "Café Nobreza", category: "Cafeteria", city: "Florianópolis/SC" },
  { name: "Sushi Kioto", category: "Restaurante Japonês", city: "Goiânia/GO" },
  { name: "MotoSpeed", category: "Concessionária Moto", city: "São Paulo/SP" },
  { name: "Padaria do Zé", category: "Padaria", city: "Belém/PA" },
  { name: "TechZone", category: "Eletrônicos", city: "Vitória/ES" },
  { name: "Boteco do Cabral", category: "Bar", city: "Salvador/BA" },
  { name: "Cinema Lux", category: "Cinema", city: "São Paulo/SP" },
  { name: "Pet Royal", category: "Pet Shop", city: "Curitiba/PR" },
  { name: "Barbearia Don Vito", category: "Barbearia", city: "Rio de Janeiro/RJ" },
  { name: "Açaí da Praia", category: "Açaiteria", city: "Recife/PE" },
  { name: "Espaço Yoga", category: "Estúdio Yoga", city: "Florianópolis/SC" },
  { name: "Bike Trail", category: "Loja de Bikes", city: "Porto Alegre/RS" },
  { name: "Mercado Verde", category: "Mercado Orgânico", city: "São Paulo/SP" },
  { name: "Studio Tattoo Black", category: "Estúdio de Tatuagem", city: "São Paulo/SP" },
  { name: "Festa Boom", category: "Eventos & Festas", city: "Brasília/DF" },
  { name: "Hotel Aurora", category: "Hotelaria", city: "Natal/RN" },
  { name: "Lava Jato Premium", category: "Estética Automotiva", city: "Belo Horizonte/MG" },
  { name: "Doce Encanto", category: "Confeitaria", city: "Rio de Janeiro/RJ" },
  { name: "Floricultura Bella", category: "Floricultura", city: "Curitiba/PR" },
  { name: "Suplementos King", category: "Loja de Suplementos", city: "Salvador/BA" },
];

const PALETTES = ["00e676", "ffd700", "c0c0c0", "16a34a", "facc15", "e5e7eb"];

export const COMPANIES: Company[] = COMPANY_SEEDS.map((c, i) => ({
  id: `c${i + 1}`,
  name: c.name,
  category: c.category,
  city: c.city,
  logo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=${PALETTES[i % PALETTES.length]}&textColor=0f0f0f&fontWeight=900`,
}));

export type Product = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  category: "Eletrônicos" | "Esportes" | "Moda" | "Casa" | "Vouchers" | "Premium";
  image?: string;
  stock: number;
  highlight?: boolean;
};

import p1Img from "@/assets/shop/p1.jpg.asset.json";
import p2Img from "@/assets/shop/p2.jpg.asset.json";
import p3Img from "@/assets/shop/p3.jpg.asset.json";
import p4Img from "@/assets/shop/p4.jpg.asset.json";
import p5Img from "@/assets/shop/p5.jpg.asset.json";
import p6Img from "@/assets/shop/p6.jpg.asset.json";
import p7Img from "@/assets/shop/p7.jpg.asset.json";
import p8Img from "@/assets/shop/p8.jpg.asset.json";
import p9Img from "@/assets/shop/p9.jpg.asset.json";
import p10Img from "@/assets/shop/p10.jpg.asset.json";
import p11Img from "@/assets/shop/p11.jpg.asset.json";
import p12Img from "@/assets/shop/p12.jpg.asset.json";
import p13Img from "@/assets/shop/p13.jpg.asset.json";
import p14Img from "@/assets/shop/p14.jpg.asset.json";
import p15Img from "@/assets/shop/p15.jpg.asset.json";
import p16Img from "@/assets/shop/p16.jpg.asset.json";
import p17Img from "@/assets/shop/p17.jpg.asset.json";
import p18Img from "@/assets/shop/p18.jpg.asset.json";
import p19Img from "@/assets/shop/p19.jpg.asset.json";
import p20Img from "@/assets/shop/p20.jpg.asset.json";
import p21Img from "@/assets/shop/p21.jpg.asset.json";
import p22Img from "@/assets/shop/p22.jpg.asset.json";
import p23Img from "@/assets/shop/p23.jpg.asset.json";
import p24Img from "@/assets/shop/p24.jpg.asset.json";

export const PRODUCTS: Product[] = [
  { id: "p1", name: "iPhone 17 Pro Max Laranja", emoji: "📱", cost: 500000, category: "Premium", stock: 3, highlight: true, image: p1Img.url },
  { id: "p2", name: "iPhone 16", emoji: "📱", cost: 400000, category: "Premium", stock: 5, highlight: true, image: p2Img.url },
  { id: "p3", name: "Xiaomi Pro 14 5G", emoji: "📱", cost: 350000, category: "Eletrônicos", stock: 8, image: p3Img.url },
  { id: "p4", name: "Camiseta Oficial do Brasil", emoji: "👕", cost: 330000, category: "Moda", stock: 12, image: p4Img.url },
  { id: "p5", name: "Bola Oficial da Copa", emoji: "⚽", cost: 180000, category: "Esportes", stock: 20, highlight: true, image: p5Img.url },
  { id: "p6", name: "Console PS5 Slim", emoji: "🎮", cost: 280000, category: "Eletrônicos", stock: 6, image: p6Img.url },
  { id: "p7", name: "Smart TV 55\" 4K", emoji: "📺", cost: 220000, category: "Eletrônicos", stock: 10, image: p7Img.url },
  { id: "p8", name: "Notebook Gamer RTX", emoji: "💻", cost: 450000, category: "Premium", stock: 4, image: p8Img.url },
  { id: "p9", name: "Apple Watch Series 10", emoji: "⌚", cost: 190000, category: "Eletrônicos", stock: 8, image: p9Img.url },
  { id: "p10", name: "Kindle Paperwhite", emoji: "📚", cost: 60000, category: "Eletrônicos", stock: 25, image: p10Img.url },
  { id: "p11", name: "Headset Bluetooth Esportivo", emoji: "🎧", cost: 15000, category: "Eletrônicos", stock: 80, image: p11Img.url },
  { id: "p12", name: "Fone Bluetooth TWS", emoji: "🎧", cost: 10000, category: "Eletrônicos", stock: 120, image: p12Img.url },
  { id: "p13", name: "Tênis Nike Air Max", emoji: "👟", cost: 95000, category: "Moda", stock: 18, image: p13Img.url },
  { id: "p14", name: "Mochila North Face", emoji: "🎒", cost: 70000, category: "Moda", stock: 22, image: p14Img.url },
  { id: "p15", name: "Voucher Steam R$200", emoji: "🎟️", cost: 25000, category: "Vouchers", stock: 200, image: p15Img.url },
  { id: "p16", name: "Voucher iFood R$100", emoji: "🍔", cost: 12000, category: "Vouchers", stock: 500, image: p16Img.url },
  { id: "p17", name: "Voucher Uber R$50", emoji: "🚗", cost: 6500, category: "Vouchers", stock: 800, image: p17Img.url },
  { id: "p18", name: "Cafeteira Nespresso", emoji: "☕", cost: 80000, category: "Casa", stock: 14, image: p18Img.url },
  { id: "p19", name: "Air Fryer 5L", emoji: "🍟", cost: 45000, category: "Casa", stock: 30, image: p19Img.url },
  { id: "p20", name: "Camisa Time Coração", emoji: "🟢", cost: 32000, category: "Esportes", stock: 40, image: p20Img.url },
  { id: "p21", name: "Chuteira Nike Mercurial", emoji: "👟", cost: 75000, category: "Esportes", stock: 16, image: p21Img.url },
  { id: "p22", name: "Skin exclusiva no perfil 🏆", emoji: "✨", cost: 5000, category: "Vouchers", stock: 9999, image: p22Img.url },
  { id: "p23", name: "Selo Profeta Dourado (perfil)", emoji: "🏅", cost: 8000, category: "Vouchers", stock: 9999, image: p23Img.url },
  { id: "p24", name: "Caixa de Som JBL Charge 5", emoji: "🔊", cost: 110000, category: "Eletrônicos", stock: 12, image: p24Img.url },
];

export type CompanyChallenge = {
  id: string;
  title: string;
  prize: string;
  participants: number;
  closesAt: string;
  status: "Aberto" | "Fechado";
  company: Company;
};

function inDays(d: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
}

export const COMPANY_CHALLENGES: CompanyChallenge[] = COMPANIES.slice(0, 18).map((c, i) => {
  const titles = [
    "Qual será o sabor mais pedido da semana?",
    "Quantos hambúrgueres vamos vender no sábado?",
    "Qual produto vai esgotar primeiro nesta promoção?",
    "Quem leva o desafio de queima calórica do mês?",
    "Qual cor de carro será mais procurada esta semana?",
    "Qual smartphone mais vendido em novembro?",
    "Qual jogo será mais vendido na Black Friday?",
    "Qual evento bate recorde de público no mês?",
    "Qual coleção vai sold out primeiro?",
    "Qual café será o mais pedido do dia?",
    "Qual combo do mês mais pedido?",
    "Quantos clientes vão entrar no sábado?",
  ];
  return {
    id: `cc${i + 1}`,
    title: titles[i % titles.length],
    prize: ["1 Pizza Grande","1 Combo Duplo","20% OFF","1 Mês Grátis","1 Voucher R$200","Brinde Surpresa"][i % 6],
    participants: Math.floor(Math.random() * 900) + 40,
    closesAt: inDays(Math.floor(Math.random() * 20) + 2),
    status: "Aberto",
    company: c,
  };
});

export type RankedUser = (typeof USERS)[number] & { wins: number; created: number };

export const RANKING_TOP100: RankedUser[] = (() => {
  // Generate 100 entries by repeating + variant
  const list: RankedUser[] = [];
  for (let i = 0; i < 100; i++) {
    const base = USERS[i % USERS.length];
    const tokens = Math.floor(1_500_000 - i * (1_500_000 / 110) + Math.random() * 8000);
    list.push({
      ...base,
      id: `top${i + 1}`,
      username: i < USERS.length ? base.username : `${base.username}_${i}`,
      tokens: Math.max(tokens, 1000),
      wins: Math.floor(800 - i * 6 + Math.random() * 40),
      created: Math.floor(120 - i * 0.8 + Math.random() * 10),
    });
  }
  return list.sort((a, b) => b.tokens - a.tokens);
})();
