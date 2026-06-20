import type { Category } from "@/lib/mock-data";
import economia from "@/assets/cat-economia.jpg";
import tecnologia from "@/assets/cat-tecnologia.jpg";
import ia from "@/assets/cat-ia.jpg";
import alienigenas from "@/assets/cat-alienigenas.jpg";
import ciencia from "@/assets/cat-ciencia.jpg";
import conspiracoes from "@/assets/cat-conspiracoes.jpg";
import entretenimento from "@/assets/cat-entretenimento.jpg";
import politica from "@/assets/cat-politica.jpg";
import brasil from "@/assets/cat-brasil.jpg";
import mundo from "@/assets/cat-mundo.jpg";
import futebol from "@/assets/cat-futebol.jpg";
import malucos from "@/assets/pm-soccer.jpg";

export const CATEGORY_IMAGES: Partial<Record<Category, string>> = {
  "Economia": economia,
  "Tecnologia": tecnologia,
  "Inteligência Artificial": ia,
  "Alienígenas": alienigenas,
  "Ciência": ciencia,
  "Conspirações": conspiracoes,
  "Entretenimento": entretenimento,
  "Política": politica,
  "Brasil": brasil,
  "Mundo": mundo,
  "Futebol": futebol,
  "Palpites Malucos da Copa": malucos,
};
