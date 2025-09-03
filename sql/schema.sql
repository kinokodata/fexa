-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    parent_id uuid,
    exam_code character varying NOT NULL DEFAULT 'FE'::character varying,
    level integer NOT NULL CHECK (level >= 1 AND level <= 5),
    category_type character varying NOT NULL CHECK (category_type::text = ANY (ARRAY['field'::character varying, 'major'::character varying, 'medium'::character varying, 'minor'::character varying, 'knowledge'::character varying]::text[])),
  name text NOT NULL,
  display_order integer,
  path text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
CREATE TABLE public.question_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL,
    category_id uuid NOT NULL,
    relevance_score numeric DEFAULT 1.00 CHECK (relevance_score >= 0::numeric AND relevance_score <= 1::numeric),
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT question_categories_pkey PRIMARY KEY (id),
  CONSTRAINT question_categories_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT question_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
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
  explanation text,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);