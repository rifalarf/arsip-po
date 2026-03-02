DO $$
DECLARE
    user_record RECORD;
    new_auth_id UUID;
BEGIN
    FOR user_record IN 
        SELECT * FROM (VALUES 
            ('Administrator', 'admin', 'admin'),
            ('Rona Kurniawan', '7150574', 'admin'),
            ('Ronald Irwanto', '3123084', 'admin'),
            ('M. Dedy Arissandi', '3032158', 'admin'),
            ('Andrisol', '3942055', 'admin'),
            ('Guntur Gumilar', '3123090', 'admin'),
            ('Dewi Yuliana Maharani', '3143275', 'admin'),
            ('Ade Sunarya', '3042327', 'buyer'),
            ('Aditya Pratama Putra', '3123163', 'buyer'),
            ('Maryono', '3052374', 'buyer'),
            ('Eggy Bachrudin', 'C07221057', 'buyer'),
            ('Cholida Maranani', '3072505', 'buyer'),
            ('Dicky Setiagraha', '3082563', 'buyer'),
            ('Eva Sepsilia Sari', '3092794', 'buyer'),
            ('Heru Winata Praja', '3092810', 'buyer'),
            ('Ato Heryanto', '3942046', 'buyer'),
            ('Nawang Wulan Jannatul Firdaus', '7221061', 'buyer'),
            ('Dian Sholihat', '3082603', 'buyer'),
            ('Gugun Gunara Taupik', '3102923', 'buyer'),
            ('Tathu Rabiatul A', '3102929', 'buyer'),
            ('Erwin Herdiyana', '3102950', 'buyer'),
            ('Mutia Virgiana', '7221059', 'buyer'),
            ('Erik Erdiana', '7221058', 'buyer'),
            ('Annafi Rohadi', '3102945', 'buyer'),
            ('Muhamad Adam Zamzami', '3123110', 'buyer'),
            ('Bambang Ahmad Makmur', '3921960', 'buyer'),
            ('Debora Geraldyn Br Tobing', '7251218', 'buyer')
        ) AS t(name, username, role)
    LOOP
        -- Check if user already exists
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE username = user_record.username) THEN
            new_auth_id := gen_random_uuid();
            
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
                aud
            ) VALUES (
                new_auth_id,
                '00000000-0000-0000-0000-000000000000',
                LOWER(user_record.username) || '@procurehub.test',
                crypt('Password@!', gen_salt('bf')),
                now(),
                now(),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                '{}',
                false,
                'authenticated',
                'authenticated'
            );

            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                new_auth_id,
                format('{"sub":"%s","email":"%s"}', new_auth_id, LOWER(user_record.username) || '@procurehub.test')::jsonb,
                'email',
                now(),
                now(),
                now()
            );

            INSERT INTO public.users (
                auth_id,
                username,
                email,
                name,
                role,
                is_active
            ) VALUES (
                new_auth_id,
                user_record.username,
                LOWER(user_record.username) || '@procurehub.test',
                user_record.name,
                user_record.role::public.user_role,
                true
            );
        END IF;
    END LOOP;
END $$;
