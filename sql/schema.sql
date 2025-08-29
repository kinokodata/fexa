-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.answers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    question_id uuid UNIQUE,
    correct_choice character varying NOT NULL,
    explanation text,
    reference_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT answers_pkey PRIMARY KEY (id),
    CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL UNIQUE,
    description text,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.choice_images (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    choice_id uuid,
    image_type character varying,
    caption text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT choice_images_pkey PRIMARY KEY (id),
    CONSTRAINT choice_images_choice_id_fkey FOREIGN KEY (choice_id) REFERENCES public.choices(id)
);
CREATE TABLE public.choices (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    question_id uuid,
    choice_label character varying NOT NULL,
    choice_text text,
    is_correct boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    has_image boolean DEFAULT false,
    CONSTRAINT choices_pkey PRIMARY KEY (id),
    CONSTRAINT choices_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.exams (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    year integer NOT NULL,
    season character varying NOT NULL,
    exam_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exams_pkey PRIMARY KEY (id)
);
CREATE TABLE public.question_images (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    question_id uuid,
    image_type character varying,
    caption text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_images_pkey PRIMARY KEY (id),
    CONSTRAINT question_images_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.questions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    exam_id uuid,
    question_number integer NOT NULL,
    question_type character varying NOT NULL DEFAULT '午前'::character varying,
    question_text text NOT NULL,
    category_id uuid,
    difficulty_level integer CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    pdf_page_number integer,
    has_image boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    has_choice_table boolean DEFAULT false,
    choice_table_type character varying CHECK (choice_table_type::text = ANY (ARRAY['markdown'::character varying, 'image'::character varying]::text[])),
    choice_table_markdown text,
    is_checked boolean DEFAULT false,
    checked_at timestamp with time zone,
    checked_by character varying,
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
    CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);