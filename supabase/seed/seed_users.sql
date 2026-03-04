DO $$
DECLARE
    user_record RECORD;
    new_auth_id UUID;
BEGIN
    FOR user_record IN 
        SELECT * FROM (VALUES 
            ('Rona Kurniawan', '07150574', '07150574@arsip.local', 'admin'),
            ('Ronald Irwanto', '3123084', '3123084@arsip.local', 'admin'),
            ('M. Dedy Arissandi', '3032158', '3032158@arsip.local', 'admin'),
            ('Andrisol', '3942055', '3942055@arsip.local', 'admin'),
            ('Guntur Gumilar', '3123090', '3123090@arsip.local', 'admin'),
            ('Dewi Yuliana Maharani', '3143275', '3143275@arsip.local', 'admin'),
            ('Ade Sunarya', '3042327', '3042327@arsip.local', 'buyer'),
            ('Aditya Pratama Putra', '3123163', '3123163@arsip.local', 'buyer'),
            ('Maryono', '3052374', '3052374@arsip.local', 'admin'),
            ('Eggy Bachrudin', 'C07221057', 'C07221057@arsip.local', 'buyer'),
            ('Cholida Maranani', '3072505', '3072505@arsip.local', 'buyer'),
            ('Dicky Setiagraha', '3082563', '3082563@arsip.local', 'buyer'),
            ('Eva Sepsilia Sari', '3092794', '3092794@arsip.local', 'buyer'),
            ('Heru Winata Praja', '3092810', '3092810@arsip.local', 'buyer'),
            ('Ato Heryanto', '3942046', '3942046@arsip.local', 'buyer'),
            ('Nawang Wulan Jannatul Firdaus', '07221061', '07221061@arsip.local', 'buyer'),
            ('Dian Sholihat', '3082603', '3082603@arsip.local', 'buyer'),
            ('Gugun Gunara Taupik', '3102923', '3102923@arsip.local', 'buyer'),
            ('Tathu Rabiatul A', '3102929', '3102929@arsip.local', 'buyer'),
            ('Erwin Herdiyana', '3102950', '3102950@arsip.local', 'buyer'),
            ('Mutia Virgiana', '07221059', '07221059@arsip.local', 'buyer'),
            ('Erik Erdiana', '07221058', '07221058@arsip.local', 'buyer'),
            ('Annafi Rohadi', '3102945', '3102945@arsip.local', 'buyer'),
            ('Muhamad Adam Zamzami', '3123110', '3123110@arsip.local', 'admin'),
            ('Bambang Ahmad Makmur', '3921960', '3921960@arsip.local', 'admin'),
            ('Debora Geraldyn Br Tobing', '07251218', '07251218@arsip.local', 'admin')
        ) AS t(name, username, email, role)
    LOOP
        -- Check if user already exists (by email)
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_record.email) THEN
            new_auth_id := gen_random_uuid();
            
            -- Insert into auth.users
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                role,
                aud,
                confirmation_token,
                recovery_token,
                email_change_token_new,
                email_change
            ) VALUES (
                new_auth_id,
                '00000000-0000-0000-0000-000000000000',
                user_record.email,
                crypt('Password@!', gen_salt('bf')),
                now(),
                now(),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                '{}',
                false,
                'authenticated',
                'authenticated',
                '',
                '',
                '',
                ''
            );

            -- Insert into auth.identities
            INSERT INTO auth.identities (
                id,
                provider_id,
                user_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                new_auth_id::text,
                new_auth_id,
                format('{"sub":"%s","email":"%s"}', new_auth_id, user_record.email)::jsonb,
                'email',
                now(),
                now(),
                now()
            );

            -- Insert into public.users
            INSERT INTO public.users (
                id,
                auth_id,
                username,
                email,
                name,
                role,
                is_active
            ) VALUES (
                gen_random_uuid(),
                new_auth_id,
                user_record.username,
                user_record.email,
                user_record.name,
                user_record.role::public.user_role,
                true
            );
        END IF;
    END LOOP;
END $$;
