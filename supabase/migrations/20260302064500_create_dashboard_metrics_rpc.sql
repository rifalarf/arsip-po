-- Migration to add get_dashboard_metrics RPC
-- This RPC calculates all the aggregate metrics needed for the dashboard in one query, 
-- avoiding the need to download all rows to the client.

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Basic counts
  _total_po integer;
  _total_archived integer;
  _total_borrowed integer;
  _active_borrows integer;
  _occupied_bins integer;
  _total_bins integer;
  
  -- Time-based counts (last 2 months)
  _this_month integer;
  _this_year integer;
  _this_month_start timestamp;
  _last_month_start timestamp;
  _this_month_boxes integer;
  _last_month_boxes integer;
  
  -- Overdue borrows (> 7 days)
  _seven_days_ago timestamp;
  _overdue_borrows integer;
  
  -- Complex structures
  _six_month_trend json;
  _top_buyers json;
  _activities json;
  _recent_boxes json;
  
  _result json;
BEGIN
  -- 1. Base KPIs
  SELECT count(*) INTO _total_po FROM pos;
  
  SELECT count(*) INTO _total_archived FROM boxes WHERE status = 'ARCHIVED';
  
  SELECT count(*) INTO _total_borrowed FROM pos WHERE borrow_status = 'BORROWED';
  
  SELECT count(*) INTO _active_borrows FROM borrow_logs WHERE returned_at IS NULL;
  
  SELECT count(*) INTO _total_bins FROM bins WHERE is_active = true;
  
  -- Count unique occupied bins
  SELECT count(DISTINCT bin_id) INTO _occupied_bins FROM boxes WHERE bin_id IS NOT NULL AND status = 'ARCHIVED';

  -- 2. Time-based KPIs
  _this_month := extract(month from now())::integer;
  _this_year := extract(year from now())::integer;
  
  -- Generate timestamps for exactly start of months
  _this_month_start := make_timestamp(_this_year, _this_month, 1, 0, 0, 0);
  
  IF _this_month = 1 THEN
    _last_month_start := make_timestamp(_this_year - 1, 12, 1, 0, 0, 0);
  ELSE
    _last_month_start := make_timestamp(_this_year, _this_month - 1, 1, 0, 0, 0);
  END IF;

  SELECT count(*) INTO _this_month_boxes 
  FROM boxes 
  WHERE created_at >= _this_month_start;
  
  SELECT count(*) INTO _last_month_boxes 
  FROM boxes 
  WHERE created_at >= _last_month_start AND created_at < _this_month_start;

  _seven_days_ago := now() - interval '7 days';
  
  SELECT count(*) INTO _overdue_borrows 
  FROM borrow_logs 
  WHERE returned_at IS NULL AND borrowed_at < _seven_days_ago;

  -- 3. 6-Month Trend
  SELECT json_agg(t) INTO _six_month_trend
  FROM (
    WITH RECURSIVE months AS (
      SELECT date_trunc('month', now()) AS month_start, 0 AS step
      UNION ALL
      SELECT (month_start - interval '1 month'), step + 1
      FROM months
      WHERE step < 5
    )
    SELECT 
      m.month_start,
      extract(month from m.month_start) as month_val,
      extract(year from m.month_start) as year_val,
      count(b.id) as count
    FROM months m
    LEFT JOIN boxes b ON date_trunc('month', b.created_at) = m.month_start
    GROUP BY m.month_start, month_val, year_val
    ORDER BY m.month_start ASC
  ) t;

  -- 4. Top Buyers
  SELECT json_agg(tb) INTO _top_buyers
  FROM (
    SELECT buyer_name, count(*) as count
    FROM pos
    GROUP BY buyer_name
    ORDER BY count DESC
    LIMIT 3
  ) tb;

  -- 5. Recent Activities (combines creates, relocates, borrows, returns)
  SELECT json_agg(act) INTO _activities
  FROM (
    SELECT type, label, detail, time FROM (
      -- Box Creates
      (SELECT 
        'create' as type,
        COALESCE(no_gungyu, 'Box ' || tahun) as label,
        'Arsip dibuat oleh ' || COALESCE(owner_name, 'Unknown') as detail,
        created_at as time
      FROM boxes
      ORDER BY created_at DESC LIMIT 15)
      
      UNION ALL
      
      -- Box Relocates
      (SELECT 
        'relocate' as type,
        COALESCE(b.no_gungyu, 'Box') as label,
        'Dipindahkan ke ' || COALESCE(to_bin_id::text, '') as detail,
        h.moved_at as time
      FROM box_location_history h
      LEFT JOIN boxes b ON b.id = h.box_id
      ORDER BY moved_at DESC LIMIT 15)
      
      UNION ALL
      
      -- Borrows
      (SELECT 
        'borrow' as type,
        no_po as label,
        'Dipinjam oleh ' || COALESCE(borrower_name, 'Unknown') as detail,
        borrowed_at as time
      FROM borrow_logs
      ORDER BY borrowed_at DESC LIMIT 15)

      UNION ALL
      
      -- Returns
      (SELECT 
        'return' as type,
        no_po as label,
        'Dikembalikan' as detail,
        returned_at as time
      FROM borrow_logs
      WHERE returned_at IS NOT NULL
      ORDER BY returned_at DESC LIMIT 15)
    ) all_activities 
    ORDER BY time DESC
    LIMIT 5
  ) act;

  -- 6. Recent Boxes (for Box Terbaru section)
  SELECT json_agg(rb) INTO _recent_boxes
  FROM (
    SELECT id, status, no_gungyu, tahun, location_code
    FROM boxes
    ORDER BY created_at DESC
    LIMIT 4
  ) rb;

  -- Build final JSON result
  _result := json_build_object(
    'total_po', _total_po,
    'total_archived', _total_archived,
    'total_borrowed', _total_borrowed,
    'active_borrows', _active_borrows,
    'occupied_bins', _occupied_bins,
    'total_bins', _total_bins,
    'this_month_boxes', _this_month_boxes,
    'last_month_boxes', _last_month_boxes,
    'overdue_borrows', _overdue_borrows,
    'six_month_trend', COALESCE(_six_month_trend, '[]'::json),
    'top_buyers', COALESCE(_top_buyers, '[]'::json),
    'activities', COALESCE(_activities, '[]'::json),
    'recent_boxes', COALESCE(_recent_boxes, '[]'::json)
  );

  RETURN _result;
END;
$$;
