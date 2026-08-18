SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict YnclPA9m2GIyzOTzdXKIXumJOoDa54iXsvenbu2Tk0fKIl4tUJS8mjnvgsdIZQW

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '9b74e069-d185-488f-9fc4-e91ac1bc3afd', '{"action":"user_signedup","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-16 20:02:37.246825+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f716d605-0de1-4532-bccd-296ee6e67587', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:02:37.260617+00', ''),
	('00000000-0000-0000-0000-000000000000', '2cc3895d-38db-414f-b5de-71ff833069be', '{"action":"user_signedup","actor_id":"b4509096-4287-4e6e-84cd-429e7ede981f","actor_username":"teacher@gillytech.dev","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-16 20:02:37.377388+00', ''),
	('00000000-0000-0000-0000-000000000000', '0cade1a0-f487-4617-bb53-1979ff720f9d', '{"action":"login","actor_id":"b4509096-4287-4e6e-84cd-429e7ede981f","actor_username":"teacher@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:02:37.388343+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0cc4d37-b4c1-45af-a692-44d9c9dc9e4a', '{"action":"user_signedup","actor_id":"a3cb35ae-f343-4751-9eda-78899e398e89","actor_username":"amara@gillytech.dev","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-16 20:02:37.496609+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f6182a0-beb8-41bf-8d4b-e4caddd05cb2', '{"action":"login","actor_id":"a3cb35ae-f343-4751-9eda-78899e398e89","actor_username":"amara@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:02:37.507064+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c0bc36a4-3c56-4e86-98ae-0ac4534e3ad1', '{"action":"login","actor_id":"b4509096-4287-4e6e-84cd-429e7ede981f","actor_username":"teacher@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:02:57.40522+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e6d3154-fc66-40ef-a123-6439ae6181fb', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:03:04.153782+00', ''),
	('00000000-0000-0000-0000-000000000000', '0c19610a-9394-4862-8629-986b3f14cc17', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:07:09.575785+00', ''),
	('00000000-0000-0000-0000-000000000000', '7c58dd25-2206-467f-9c19-73cd849ae281', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:07:22.547253+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c907675-0cf6-47c3-96b6-97f656b43f54', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:49:12.355506+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bfc4e545-4e3d-4b1c-8531-004bc34e5f55', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:49:18.916046+00', ''),
	('00000000-0000-0000-0000-000000000000', '07a5dd86-447b-4009-b117-373d953351af', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:49:48.77599+00', ''),
	('00000000-0000-0000-0000-000000000000', '3dd25b63-c798-4dbf-bef4-8e1f8914a143', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:49:50.18875+00', ''),
	('00000000-0000-0000-0000-000000000000', '558d88af-de10-4c60-bf8e-579e558d5570', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:55:18.107745+00', ''),
	('00000000-0000-0000-0000-000000000000', 'db6f1549-8f00-45a6-8236-643ef599917a', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:55:21.137192+00', ''),
	('00000000-0000-0000-0000-000000000000', '8888c8b1-02ce-454f-a983-0f0f9c979b7f', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:55:26.145566+00', ''),
	('00000000-0000-0000-0000-000000000000', 'adfe1657-4e36-4052-85be-c157c6b451fd', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:55:26.90452+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a27b537-00b2-4a95-8de6-1271354f8762', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 20:55:27.881158+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9f5c807-bfe9-45d7-8027-ca408b2fe184', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 21:01:57.876865+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ab35c190-716a-4ead-bd0e-755a088019e8', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 21:02:08.046593+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ac21301-361a-4370-94de-2a47ebb601dc', '{"action":"login","actor_id":"aec54503-f09c-40c1-beee-448610c95b52","actor_username":"admin@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 21:05:17.334255+00', ''),
	('00000000-0000-0000-0000-000000000000', '28a7c603-529b-4d5e-b865-d99ed5ad6066', '{"action":"login","actor_id":"b4509096-4287-4e6e-84cd-429e7ede981f","actor_username":"teacher@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 21:30:30.511264+00', ''),
	('00000000-0000-0000-0000-000000000000', '027efbe7-0080-4639-af5a-1f44136af06c', '{"action":"login","actor_id":"a3cb35ae-f343-4751-9eda-78899e398e89","actor_username":"amara@gillytech.dev","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-16 21:31:06.379627+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fa03c0ab-5dc2-4b48-b0a4-03d8c3ffd319', '{"action":"token_refreshed","actor_id":"a3cb35ae-f343-4751-9eda-78899e398e89","actor_username":"amara@gillytech.dev","actor_via_sso":false,"log_type":"token"}', '2026-08-18 18:20:35.048634+00', ''),
	('00000000-0000-0000-0000-000000000000', '2572fd88-7b2c-4182-bf3d-8ab62a68696e', '{"action":"token_revoked","actor_id":"a3cb35ae-f343-4751-9eda-78899e398e89","actor_username":"amara@gillytech.dev","actor_via_sso":false,"log_type":"token"}', '2026-08-18 18:20:35.05237+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c389b012-474b-46cb-be69-13bd3ed07b4d', '{"action":"logout","actor_id":"a3cb35ae-f343-4751-9eda-78899e398e89","actor_username":"amara@gillytech.dev","actor_via_sso":false,"log_type":"account"}', '2026-08-18 18:40:37.272597+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'aec54503-f09c-40c1-beee-448610c95b52', 'authenticated', 'authenticated', 'admin@gillytech.dev', '$2a$10$6vjak7Ynfr8G19hYQCbUyOffreUBZhf8cvpAhg8sI0lQmCmXqNmlO', '2026-08-16 20:02:37.249151+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-16 21:05:17.335279+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "aec54503-f09c-40c1-beee-448610c95b52", "name": "Admin User", "role": "admin", "email": "admin@gillytech.dev", "email_verified": true, "phone_verified": false}', NULL, '2026-08-16 20:02:37.239761+00', '2026-08-16 21:05:17.338274+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b4509096-4287-4e6e-84cd-429e7ede981f', 'authenticated', 'authenticated', 'teacher@gillytech.dev', '$2a$10$X2EJn3e1dIcxV2LdD1Ko4ev4rcRYclQU19A7/4ZshH2sjrt0BZxuS', '2026-08-16 20:02:37.377865+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-16 21:30:30.51245+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "b4509096-4287-4e6e-84cd-429e7ede981f", "name": "Ms. Achieng Otieno", "role": "teacher", "email": "teacher@gillytech.dev", "email_verified": true, "phone_verified": false}', NULL, '2026-08-16 20:02:37.371115+00', '2026-08-16 21:30:30.515392+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'a3cb35ae-f343-4751-9eda-78899e398e89', 'authenticated', 'authenticated', 'amara@gillytech.dev', '$2a$10$.pwpx.ceTz505At/FQMxO.m3PwmmpBb7PqsTgcnBtZyXkUolBZHWe', '2026-08-16 20:02:37.496978+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-16 21:31:06.38051+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "a3cb35ae-f343-4751-9eda-78899e398e89", "name": "Amara Osei", "role": "student", "email": "amara@gillytech.dev", "email_verified": true, "phone_verified": false}', NULL, '2026-08-16 20:02:37.491124+00', '2026-08-18 18:20:35.068562+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('aec54503-f09c-40c1-beee-448610c95b52', 'aec54503-f09c-40c1-beee-448610c95b52', '{"sub": "aec54503-f09c-40c1-beee-448610c95b52", "name": "Admin User", "role": "admin", "email": "admin@gillytech.dev", "email_verified": false, "phone_verified": false}', 'email', '2026-08-16 20:02:37.244629+00', '2026-08-16 20:02:37.244658+00', '2026-08-16 20:02:37.244658+00', '6f185b71-fb01-41e2-9391-3b4a17725728'),
	('b4509096-4287-4e6e-84cd-429e7ede981f', 'b4509096-4287-4e6e-84cd-429e7ede981f', '{"sub": "b4509096-4287-4e6e-84cd-429e7ede981f", "name": "Ms. Achieng Otieno", "role": "teacher", "email": "teacher@gillytech.dev", "email_verified": false, "phone_verified": false}', 'email', '2026-08-16 20:02:37.375692+00', '2026-08-16 20:02:37.375726+00', '2026-08-16 20:02:37.375726+00', 'f3f7e547-002d-4d2e-9918-c2dfb3c365ee'),
	('a3cb35ae-f343-4751-9eda-78899e398e89', 'a3cb35ae-f343-4751-9eda-78899e398e89', '{"sub": "a3cb35ae-f343-4751-9eda-78899e398e89", "name": "Amara Osei", "role": "student", "email": "amara@gillytech.dev", "email_verified": false, "phone_verified": false}', 'email', '2026-08-16 20:02:37.494956+00', '2026-08-16 20:02:37.494985+00', '2026-08-16 20:02:37.494985+00', 'b3f49956-b70b-40d8-8a10-b23d2df8aab5');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('2f9cb88e-cdc5-4df0-83be-435f8056404c', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:02:37.261744+00', '2026-08-16 20:02:37.261744+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('2faa558a-56eb-43bf-b90f-6c5a21c73b9c', 'b4509096-4287-4e6e-84cd-429e7ede981f', '2026-08-16 20:02:37.389642+00', '2026-08-16 20:02:37.389642+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('272ee00b-8d36-4b4e-b5e5-42a84f2448ed', 'b4509096-4287-4e6e-84cd-429e7ede981f', '2026-08-16 20:02:57.409951+00', '2026-08-16 20:02:57.409951+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('d86fef8a-d4bf-4cd4-a5f3-a3e2b82ba775', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:03:04.154816+00', '2026-08-16 20:03:04.154816+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('b5779642-5180-4170-b5cc-5c65e27dadba', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:07:09.576657+00', '2026-08-16 20:07:09.576657+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('6c08de0c-da59-4ad0-846e-7ca887dd8ff8', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:07:22.548215+00', '2026-08-16 20:07:22.548215+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('bfb406f6-dc08-4161-8f7e-801c5a5c6f53', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:49:12.356423+00', '2026-08-16 20:49:12.356423+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('59f7abbb-3a09-45c3-bb40-7fe6957c0ca5', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:49:18.916989+00', '2026-08-16 20:49:18.916989+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('db9f737e-6190-4d32-b139-a176681008fb', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:49:48.776992+00', '2026-08-16 20:49:48.776992+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('d9c15fcc-3056-43b1-b69c-4de63685b439', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:49:50.189838+00', '2026-08-16 20:49:50.189838+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('d9659e79-2c8e-4a0e-905c-388488611565', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:55:18.109906+00', '2026-08-16 20:55:18.109906+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('2046a969-0f8a-4905-82c3-5ce3024091c6', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:55:21.138284+00', '2026-08-16 20:55:21.138284+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('4712b21f-3878-49dc-b333-3b8dbad56f69', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:55:26.146977+00', '2026-08-16 20:55:26.146977+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('e1e91c4c-500a-49a6-9629-8638874f94d3', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:55:26.905733+00', '2026-08-16 20:55:26.905733+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('06771066-f8e5-4eb9-b019-79e65e7bcb8d', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 20:55:27.882063+00', '2026-08-16 20:55:27.882063+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('c931b455-a566-434f-b7fa-75f9dc9e9f95', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 21:01:57.877807+00', '2026-08-16 21:01:57.877807+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('a8cc78a7-0eab-4387-9121-0e0dff7ab626', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 21:02:08.047485+00', '2026-08-16 21:02:08.047485+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('9332e2a6-9fee-4808-9f78-3727b10945d8', 'aec54503-f09c-40c1-beee-448610c95b52', '2026-08-16 21:05:17.335343+00', '2026-08-16 21:05:17.335343+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('a1933b37-fa97-4200-90ba-b630041e97c8', 'b4509096-4287-4e6e-84cd-429e7ede981f', '2026-08-16 21:30:30.512521+00', '2026-08-16 21:30:30.512521+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('2f9cb88e-cdc5-4df0-83be-435f8056404c', '2026-08-16 20:02:37.266998+00', '2026-08-16 20:02:37.266998+00', 'password', 'fff2ec8e-cc0d-4297-9bf9-91653c6488cc'),
	('2faa558a-56eb-43bf-b90f-6c5a21c73b9c', '2026-08-16 20:02:37.393413+00', '2026-08-16 20:02:37.393413+00', 'password', '1968a357-7f69-4ba3-a3e2-b3b910e036b3'),
	('272ee00b-8d36-4b4e-b5e5-42a84f2448ed', '2026-08-16 20:02:57.420692+00', '2026-08-16 20:02:57.420692+00', 'password', '3ab93698-87ba-404f-b5f8-2a9cc61d3e28'),
	('d86fef8a-d4bf-4cd4-a5f3-a3e2b82ba775', '2026-08-16 20:03:04.157929+00', '2026-08-16 20:03:04.157929+00', 'password', 'efc6689c-6e40-4b05-a78a-ded4f76e1120'),
	('b5779642-5180-4170-b5cc-5c65e27dadba', '2026-08-16 20:07:09.579459+00', '2026-08-16 20:07:09.579459+00', 'password', '96ed343e-5aca-458c-9c92-10e056105f8e'),
	('6c08de0c-da59-4ad0-846e-7ca887dd8ff8', '2026-08-16 20:07:22.551227+00', '2026-08-16 20:07:22.551227+00', 'password', 'ce693070-0b87-41c7-ae64-6ae717be9b40'),
	('bfb406f6-dc08-4161-8f7e-801c5a5c6f53', '2026-08-16 20:49:12.35974+00', '2026-08-16 20:49:12.35974+00', 'password', '0eeeadc6-6295-4aec-86d8-26064854b6f8'),
	('59f7abbb-3a09-45c3-bb40-7fe6957c0ca5', '2026-08-16 20:49:18.919715+00', '2026-08-16 20:49:18.919715+00', 'password', '01dc9cb2-4f04-4969-8289-14a70e78ad21'),
	('db9f737e-6190-4d32-b139-a176681008fb', '2026-08-16 20:49:48.779626+00', '2026-08-16 20:49:48.779626+00', 'password', '79b86373-3a0c-4e4c-994b-ca5c20fe5b42'),
	('d9c15fcc-3056-43b1-b69c-4de63685b439', '2026-08-16 20:49:50.192915+00', '2026-08-16 20:49:50.192915+00', 'password', '34623760-e62b-467f-9f83-9a61d80b8e19'),
	('d9659e79-2c8e-4a0e-905c-388488611565', '2026-08-16 20:55:18.115675+00', '2026-08-16 20:55:18.115675+00', 'password', '1e57d491-b876-44a9-9d1c-268fc5e563d9'),
	('2046a969-0f8a-4905-82c3-5ce3024091c6', '2026-08-16 20:55:21.144085+00', '2026-08-16 20:55:21.144085+00', 'password', 'c8d3918b-727e-4369-b50d-2ec53b64f821'),
	('4712b21f-3878-49dc-b333-3b8dbad56f69', '2026-08-16 20:55:26.151253+00', '2026-08-16 20:55:26.151253+00', 'password', 'd704f893-2ecb-4414-a4a2-465d253041c4'),
	('e1e91c4c-500a-49a6-9629-8638874f94d3', '2026-08-16 20:55:26.90851+00', '2026-08-16 20:55:26.90851+00', 'password', '71db628b-6b26-4139-8ddd-badb12efec1b'),
	('06771066-f8e5-4eb9-b019-79e65e7bcb8d', '2026-08-16 20:55:27.885217+00', '2026-08-16 20:55:27.885217+00', 'password', 'c854ef61-c44c-44e5-9083-8b3241e471c1'),
	('c931b455-a566-434f-b7fa-75f9dc9e9f95', '2026-08-16 21:01:57.881441+00', '2026-08-16 21:01:57.881441+00', 'password', '2ae93100-0ae0-46db-84f8-28e7632f3520'),
	('a8cc78a7-0eab-4387-9121-0e0dff7ab626', '2026-08-16 21:02:08.050256+00', '2026-08-16 21:02:08.050256+00', 'password', '838ec0d3-3919-48b9-8d15-2120429102fe'),
	('9332e2a6-9fee-4808-9f78-3727b10945d8', '2026-08-16 21:05:17.3387+00', '2026-08-16 21:05:17.3387+00', 'password', '2907a425-8c09-4ddf-a96f-1bcc218dd8ce'),
	('a1933b37-fa97-4200-90ba-b630041e97c8', '2026-08-16 21:30:30.516236+00', '2026-08-16 21:30:30.516236+00', 'password', '11b8b4c9-fd3a-47ba-bffb-07bda4675032');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'gqejubzeuwfg', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:02:37.263926+00', '2026-08-16 20:02:37.263926+00', NULL, '2f9cb88e-cdc5-4df0-83be-435f8056404c'),
	('00000000-0000-0000-0000-000000000000', 2, 'wmzzojuw4n53', 'b4509096-4287-4e6e-84cd-429e7ede981f', false, '2026-08-16 20:02:37.391822+00', '2026-08-16 20:02:37.391822+00', NULL, '2faa558a-56eb-43bf-b90f-6c5a21c73b9c'),
	('00000000-0000-0000-0000-000000000000', 4, 'fobukoqe4ecg', 'b4509096-4287-4e6e-84cd-429e7ede981f', false, '2026-08-16 20:02:57.418509+00', '2026-08-16 20:02:57.418509+00', NULL, '272ee00b-8d36-4b4e-b5e5-42a84f2448ed'),
	('00000000-0000-0000-0000-000000000000', 5, 'e7drch3wp67p', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:03:04.156601+00', '2026-08-16 20:03:04.156601+00', NULL, 'd86fef8a-d4bf-4cd4-a5f3-a3e2b82ba775'),
	('00000000-0000-0000-0000-000000000000', 6, 'bekxvm2mgr7a', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:07:09.578167+00', '2026-08-16 20:07:09.578167+00', NULL, 'b5779642-5180-4170-b5cc-5c65e27dadba'),
	('00000000-0000-0000-0000-000000000000', 7, 'xowghckjyidp', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:07:22.54985+00', '2026-08-16 20:07:22.54985+00', NULL, '6c08de0c-da59-4ad0-846e-7ca887dd8ff8'),
	('00000000-0000-0000-0000-000000000000', 8, '6wolkb7sn32h', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:49:12.358229+00', '2026-08-16 20:49:12.358229+00', NULL, 'bfb406f6-dc08-4161-8f7e-801c5a5c6f53'),
	('00000000-0000-0000-0000-000000000000', 9, 'heknyolw3s4n', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:49:18.918448+00', '2026-08-16 20:49:18.918448+00', NULL, '59f7abbb-3a09-45c3-bb40-7fe6957c0ca5'),
	('00000000-0000-0000-0000-000000000000', 10, '2krojxodhtm3', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:49:48.778478+00', '2026-08-16 20:49:48.778478+00', NULL, 'db9f737e-6190-4d32-b139-a176681008fb'),
	('00000000-0000-0000-0000-000000000000', 11, 'uyimnzrcvunf', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:49:50.191436+00', '2026-08-16 20:49:50.191436+00', NULL, 'd9c15fcc-3056-43b1-b69c-4de63685b439'),
	('00000000-0000-0000-0000-000000000000', 12, 'rurngwgclend', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:55:18.112559+00', '2026-08-16 20:55:18.112559+00', NULL, 'd9659e79-2c8e-4a0e-905c-388488611565'),
	('00000000-0000-0000-0000-000000000000', 13, 'c6bvus6mbthb', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:55:21.140147+00', '2026-08-16 20:55:21.140147+00', NULL, '2046a969-0f8a-4905-82c3-5ce3024091c6'),
	('00000000-0000-0000-0000-000000000000', 14, 'fx77exguuby5', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:55:26.149083+00', '2026-08-16 20:55:26.149083+00', NULL, '4712b21f-3878-49dc-b333-3b8dbad56f69'),
	('00000000-0000-0000-0000-000000000000', 15, 'zcuz62lp7gvw', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:55:26.907211+00', '2026-08-16 20:55:26.907211+00', NULL, 'e1e91c4c-500a-49a6-9629-8638874f94d3'),
	('00000000-0000-0000-0000-000000000000', 16, 'pycwpx2ixqp5', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 20:55:27.88374+00', '2026-08-16 20:55:27.88374+00', NULL, '06771066-f8e5-4eb9-b019-79e65e7bcb8d'),
	('00000000-0000-0000-0000-000000000000', 17, 'aofq7p45zwli', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 21:01:57.879737+00', '2026-08-16 21:01:57.879737+00', NULL, 'c931b455-a566-434f-b7fa-75f9dc9e9f95'),
	('00000000-0000-0000-0000-000000000000', 18, 't4jaeqxeqjsz', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 21:02:08.048957+00', '2026-08-16 21:02:08.048957+00', NULL, 'a8cc78a7-0eab-4387-9121-0e0dff7ab626'),
	('00000000-0000-0000-0000-000000000000', 19, 'yu2gf3jlhyae', 'aec54503-f09c-40c1-beee-448610c95b52', false, '2026-08-16 21:05:17.337067+00', '2026-08-16 21:05:17.337067+00', NULL, '9332e2a6-9fee-4808-9f78-3727b10945d8'),
	('00000000-0000-0000-0000-000000000000', 20, 'lm3f5mlsdouo', 'b4509096-4287-4e6e-84cd-429e7ede981f', false, '2026-08-16 21:30:30.514219+00', '2026-08-16 21:30:30.514219+00', NULL, 'a1933b37-fa97-4200-90ba-b630041e97c8');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schools" ("id", "name", "country", "city", "created_at") VALUES
	('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'Nairobi STEM Academy', 'Kenya', 'Nairobi', '2026-08-15 19:53:02.25424+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "school_id", "name", "email", "password_hash", "role", "avatar", "subject", "created_at") VALUES
	('aec54503-f09c-40c1-beee-448610c95b52', NULL, 'Admin User', 'admin@gillytech.dev', NULL, 'admin', NULL, NULL, '2026-08-16 20:02:37.239464+00'),
	('b4509096-4287-4e6e-84cd-429e7ede981f', NULL, 'Ms. Achieng Otieno', 'teacher@gillytech.dev', NULL, 'teacher', NULL, NULL, '2026-08-16 20:02:37.370884+00'),
	('a3cb35ae-f343-4751-9eda-78899e398e89', NULL, 'Amara Osei', 'amara@gillytech.dev', NULL, 'student', NULL, NULL, '2026-08-16 20:02:37.490914+00');


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: question_bank; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 22, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict YnclPA9m2GIyzOTzdXKIXumJOoDa54iXsvenbu2Tk0fKIl4tUJS8mjnvgsdIZQW

RESET ALL;
