-- ============================================
-- 뚝딱 마켓플레이스 Supabase 테이블 설계
-- ============================================

-- 1. 프로필 (auth.users 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'expert', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 카테고리
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id TEXT REFERENCES categories(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 전문가
CREATE TABLE IF NOT EXISTS experts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  title TEXT,
  profile_image TEXT,
  category_id TEXT REFERENCES categories(id),
  is_prime BOOLEAN DEFAULT FALSE,
  is_master BOOLEAN DEFAULT FALSE,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  completion_rate INT DEFAULT 0,
  response_time TEXT,
  skills TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  introduction TEXT,
  joined_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 서비스
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  images TEXT[] DEFAULT '{}',
  category_id TEXT REFERENCES categories(id),
  expert_id TEXT REFERENCES experts(id),
  price INT NOT NULL,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_prime BOOLEAN DEFAULT FALSE,
  is_fast_response BOOLEAN DEFAULT FALSE,
  packages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 주문
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id),
  service_id TEXT REFERENCES services(id),
  expert_id TEXT REFERENCES experts(id),
  package_name TEXT NOT NULL,
  price INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'in_progress', 'review', 'completed', 'cancelled', 'refunded')),
  payment_id TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 리뷰
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  service_id TEXT REFERENCES services(id),
  reviewer_id UUID REFERENCES profiles(id),
  reviewer_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 메시지 (대화방)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES profiles(id),
  participant_2 UUID REFERENCES profiles(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 메시지
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 즐겨찾기
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- 10. 전문가 등록 신청
CREATE TABLE IF NOT EXISTS expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  skills TEXT[] DEFAULT '{}',
  portfolio_urls TEXT[] DEFAULT '{}',
  introduction TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 견적 요청
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  category TEXT,
  budget_min INT,
  budget_max INT,
  deadline DATE,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_expert ON services(expert_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_experts_category ON experts(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_expert ON orders(expert_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- 프로필: 본인만 수정, 모두 읽기
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 카테고리: 모두 읽기
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

-- 전문가: 모두 읽기
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experts_public_read" ON experts FOR SELECT USING (true);

-- 서비스: 모두 읽기, 본인 서비스만 수정
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_public_read" ON services FOR SELECT USING (true);

-- 주문: 구매자/전문가만 읽기
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own_read" ON orders FOR SELECT USING (
  auth.uid() = buyer_id OR
  auth.uid() IN (SELECT user_id FROM experts WHERE id = orders.expert_id)
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 리뷰: 모두 읽기, 본인만 작성
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 대화: 참여자만 읽기
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_own_read" ON conversations FOR SELECT USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- 메시지: 대화 참여자만 읽기/작성
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_own_read" ON messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 즐겨찾기: 본인만 관리
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON favorites FOR ALL USING (auth.uid() = user_id);

-- 전문가 신청: 본인만
ALTER TABLE expert_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_own" ON expert_applications FOR ALL USING (auth.uid() = user_id);

-- 견적 요청: 본인 작성, 전문가 읽기
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_public_read" ON quote_requests FOR SELECT USING (true);
CREATE POLICY "quotes_own_insert" ON quote_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 트리거: 신규 가입 시 프로필 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 트리거: 리뷰 생성 시 서비스/전문가 평점 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- 서비스 평점 업데이트
  UPDATE services SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE service_id = NEW.service_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE service_id = NEW.service_id),
    updated_at = NOW()
  WHERE id = NEW.service_id;

  -- 전문가 평점 업데이트
  UPDATE experts SET
    rating = (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r JOIN services s ON r.service_id = s.id WHERE s.expert_id = (SELECT expert_id FROM services WHERE id = NEW.service_id)),
    review_count = (SELECT COUNT(*) FROM reviews r JOIN services s ON r.service_id = s.id WHERE s.expert_id = (SELECT expert_id FROM services WHERE id = NEW.service_id)),
    updated_at = NOW()
  WHERE id = (SELECT expert_id FROM services WHERE id = NEW.service_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_ratings();
