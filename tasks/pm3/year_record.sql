year_record, 
count(1) as num_tmcs,
sum(segment_length) as total_miles,
Round(sum(case 
	when greatest(lottr_amp, lottr_midd, lottr_pmp, lottr_we) >= 1.5 then 0
	when f_system = 1 and nhs IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code > 0  and facility_type IN (1, 2, 6) then segment_length * ROUND(dir_aadt, 0) * occ_fac
    else 0 
end) /
sum(case 
	when  f_system = 1 and nhs IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code > 0  and facility_type IN (1, 2, 6) 
	then  segment_length * ROUND(dir_aadt, 0) * occ_fac else 0 end) * 100, 2) as lottr_interstate,
Round(sum(case 
	when greatest(lottr_amp, lottr_midd, lottr_pmp, lottr_we) >= 1.5 then 0
	when f_system > 1 and nhs IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code > 0  and facility_type IN (1, 2, 6) then segment_length * ROUND(dir_aadt, 0) * occ_fac
    else 0 
end) /
sum(case 
	when f_system > 1 and nhs IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code > 0  and facility_type IN (1, 2, 6) 
	then  segment_length * ROUND(dir_aadt, 0) * occ_fac else 0 end) * 100, 2) as lottr_non_interstate,
round(sum(case 
	when f_system = 1 and nhs IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code > 0  and facility_type IN (1, 2, 6) 
	then (greatest(tttr_amp, tttr_midd, tttr_pmp, tttr_we, tttr_ovn) * segment_length)
	else 0
end) / sum(case 
	when f_system = 1 and nhs IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code > 0  and facility_type IN (1, 2, 6) 
	then (segment_length)
	else 0
end),2) as tttr_interstate,
round(sum(phed),1) as phed
