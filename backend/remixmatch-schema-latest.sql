--
-- PostgreSQL database dump
--

-- Dumped from database version 17.1 (Postgres.app)
-- Dumped by pg_dump version 17.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: live_session_users; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.live_session_users (
    session_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.live_session_users OWNER TO christine;

--
-- Name: live_sessions; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.live_sessions (
    id integer NOT NULL,
    host_id integer,
    session_name text NOT NULL,
    source_type text NOT NULL,
    source_id text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_public boolean DEFAULT false,
    CONSTRAINT live_sessions_source_type_check CHECK ((source_type = ANY (ARRAY['playlist'::text, 'track'::text, 'album'::text])))
);


ALTER TABLE public.live_sessions OWNER TO christine;

--
-- Name: live_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.live_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.live_sessions_id_seq OWNER TO christine;

--
-- Name: live_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.live_sessions_id_seq OWNED BY public.live_sessions.id;


--
-- Name: playlist_songs; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.playlist_songs (
    id integer NOT NULL,
    playlist_id integer,
    track_id text NOT NULL,
    added_by integer,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer
);


ALTER TABLE public.playlist_songs OWNER TO christine;

--
-- Name: playlist_songs_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.playlist_songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlist_songs_id_seq OWNER TO christine;

--
-- Name: playlist_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.playlist_songs_id_seq OWNED BY public.playlist_songs.id;


--
-- Name: playlists; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.playlists (
    id integer NOT NULL,
    user_id integer,
    name text NOT NULL,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.playlists OWNER TO christine;

--
-- Name: playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.playlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlists_id_seq OWNER TO christine;

--
-- Name: playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.playlists_id_seq OWNED BY public.playlists.id;


--
-- Name: shared_playlists; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.shared_playlists (
    id integer NOT NULL,
    playlist_id integer,
    from_user_id integer,
    to_user_id integer,
    shared_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shared_playlists OWNER TO christine;

--
-- Name: shared_playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.shared_playlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shared_playlists_id_seq OWNER TO christine;

--
-- Name: shared_playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.shared_playlists_id_seq OWNED BY public.shared_playlists.id;


--
-- Name: shares; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.shares (
    id integer NOT NULL,
    shared_by integer NOT NULL,
    shared_with integer NOT NULL,
    playlist_id integer,
    track_id text NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shares OWNER TO christine;

--
-- Name: shares_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shares_id_seq OWNER TO christine;

--
-- Name: shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.shares_id_seq OWNED BY public.shares.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO christine;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO christine;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: christine
--

CREATE TABLE public.votes (
    id integer NOT NULL,
    user_id integer,
    playlist_id integer,
    vote_type integer NOT NULL,
    CONSTRAINT votes_vote_type_check CHECK ((vote_type = ANY (ARRAY[1, '-1'::integer])))
);


ALTER TABLE public.votes OWNER TO christine;

--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: christine
--

CREATE SEQUENCE public.votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.votes_id_seq OWNER TO christine;

--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: christine
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: live_sessions id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.live_sessions ALTER COLUMN id SET DEFAULT nextval('public.live_sessions_id_seq'::regclass);


--
-- Name: playlist_songs id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlist_songs ALTER COLUMN id SET DEFAULT nextval('public.playlist_songs_id_seq'::regclass);


--
-- Name: playlists id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlists ALTER COLUMN id SET DEFAULT nextval('public.playlists_id_seq'::regclass);


--
-- Name: shared_playlists id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shared_playlists ALTER COLUMN id SET DEFAULT nextval('public.shared_playlists_id_seq'::regclass);


--
-- Name: shares id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shares ALTER COLUMN id SET DEFAULT nextval('public.shares_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Name: live_session_users live_session_users_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.live_session_users
    ADD CONSTRAINT live_session_users_pkey PRIMARY KEY (session_id, user_id);


--
-- Name: live_sessions live_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.live_sessions
    ADD CONSTRAINT live_sessions_pkey PRIMARY KEY (id);


--
-- Name: playlist_songs playlist_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_pkey PRIMARY KEY (id);


--
-- Name: playlist_songs playlist_songs_playlist_id_track_id_key; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_playlist_id_track_id_key UNIQUE (playlist_id, track_id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: shared_playlists shared_playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shared_playlists
    ADD CONSTRAINT shared_playlists_pkey PRIMARY KEY (id);


--
-- Name: shared_playlists shared_playlists_playlist_id_to_user_id_key; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shared_playlists
    ADD CONSTRAINT shared_playlists_playlist_id_to_user_id_key UNIQUE (playlist_id, to_user_id);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: votes votes_user_id_playlist_id_key; Type: CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_playlist_id_key UNIQUE (user_id, playlist_id);


--
-- Name: live_session_users live_session_users_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.live_session_users
    ADD CONSTRAINT live_session_users_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.live_sessions(id) ON DELETE CASCADE;


--
-- Name: live_session_users live_session_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.live_session_users
    ADD CONSTRAINT live_session_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: live_sessions live_sessions_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.live_sessions
    ADD CONSTRAINT live_sessions_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: playlist_songs playlist_songs_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: playlist_songs playlist_songs_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: playlists playlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shared_playlists shared_playlists_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shared_playlists
    ADD CONSTRAINT shared_playlists_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shared_playlists shared_playlists_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shared_playlists
    ADD CONSTRAINT shared_playlists_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: shared_playlists shared_playlists_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shared_playlists
    ADD CONSTRAINT shared_playlists_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shares shares_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: shares shares_shared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_shared_by_fkey FOREIGN KEY (shared_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shares shares_shared_with_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_shared_with_fkey FOREIGN KEY (shared_with) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: votes votes_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: votes votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: christine
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

