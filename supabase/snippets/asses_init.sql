-- Question Bank
CREATE TABLE question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT,
    topic TEXT,
    type TEXT,
    content_json JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    marks INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    bank_id UUID REFERENCES question_bank(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL,
    type TEXT,
    marks INTEGER DEFAULT 10,
    time_limit_sec INTEGER DEFAULT 120,
    content_json JSONB NOT NULL,
    correct_answer TEXT NOT NULL
);

-- Submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    reasoning_text TEXT,
    answer TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    is_first_correct BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, student_id)
);

-- Group Scores
CREATE TABLE group_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    participation_count INTEGER DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW()
);