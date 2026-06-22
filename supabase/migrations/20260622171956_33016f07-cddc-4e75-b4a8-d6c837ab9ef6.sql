
CREATE TABLE public.world_cup_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  match_date date NOT NULL,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','em_andamento','encerrado')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_team, away_team, match_date)
);

GRANT SELECT ON public.world_cup_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.world_cup_results TO authenticated;
GRANT ALL ON public.world_cup_results TO service_role;

ALTER TABLE public.world_cup_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read results"
ON public.world_cup_results FOR SELECT
USING (true);

CREATE POLICY "Admins can insert results"
ON public.world_cup_results FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update results"
ON public.world_cup_results FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete results"
ON public.world_cup_results FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_world_cup_results_updated_at
BEFORE UPDATE ON public.world_cup_results
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.world_cup_results (home_team, away_team, match_date, home_score, away_score, status) VALUES
('México','África do Sul','2026-06-11',2,0,'encerrado'),
('Coreia do Sul','República Tcheca','2026-06-11',2,1,'encerrado'),
('Canadá','Bósnia e Herzegovina','2026-06-12',1,1,'encerrado'),
('Estados Unidos','Paraguai','2026-06-12',4,1,'encerrado'),
('Catar','Suíça','2026-06-13',1,1,'encerrado'),
('Brasil','Marrocos','2026-06-13',1,1,'encerrado'),
('Haiti','Escócia','2026-06-13',0,1,'encerrado'),
('Austrália','Turquia','2026-06-14',2,0,'encerrado'),
('Alemanha','Curaçao','2026-06-14',7,1,'encerrado'),
('Holanda','Japão','2026-06-14',2,2,'encerrado'),
('Costa do Marfim','Equador','2026-06-14',1,0,'encerrado'),
('Suécia','Tunísia','2026-06-14',5,1,'encerrado'),
('Espanha','Cabo Verde','2026-06-15',0,0,'encerrado'),
('Bélgica','Egito','2026-06-15',1,1,'encerrado'),
('Arábia Saudita','Uruguai','2026-06-15',1,1,'encerrado'),
('Irã','Nova Zelândia','2026-06-15',2,2,'encerrado'),
('França','Senegal','2026-06-16',3,1,'encerrado'),
('Iraque','Noruega','2026-06-16',1,4,'encerrado'),
('Argentina','Argélia','2026-06-16',3,0,'encerrado'),
('Áustria','Jordânia','2026-06-17',3,1,'encerrado'),
('Portugal','República Democrática do Congo','2026-06-17',1,1,'encerrado'),
('Inglaterra','Croácia','2026-06-17',4,2,'encerrado'),
('Gana','Panamá','2026-06-17',1,0,'encerrado'),
('Uzbequistão','Colômbia','2026-06-17',1,3,'encerrado'),
('República Tcheca','África do Sul','2026-06-18',1,1,'encerrado'),
('Suíça','Bósnia e Herzegovina','2026-06-18',4,1,'encerrado'),
('Canadá','Catar','2026-06-18',6,0,'encerrado'),
('México','Coreia do Sul','2026-06-18',1,0,'encerrado'),
('Estados Unidos','Austrália','2026-06-19',2,0,'encerrado'),
('Escócia','Marrocos','2026-06-19',0,1,'encerrado'),
('Brasil','Haiti','2026-06-19',3,0,'encerrado'),
('Turquia','Paraguai','2026-06-19',0,1,'encerrado'),
('Holanda','Suécia','2026-06-20',5,1,'encerrado'),
('Alemanha','Costa do Marfim','2026-06-20',2,1,'encerrado'),
('Equador','Curaçao','2026-06-20',0,0,'encerrado'),
('Tunísia','Japão','2026-06-21',0,4,'encerrado'),
('Espanha','Arábia Saudita','2026-06-21',4,0,'encerrado'),
('Bélgica','Irã','2026-06-21',0,0,'encerrado'),
('Uruguai','Cabo Verde','2026-06-21',2,2,'encerrado'),
('Nova Zelândia','Egito','2026-06-21',1,3,'encerrado'),
('Argentina','Áustria','2026-06-22',0,0,'em_andamento');
