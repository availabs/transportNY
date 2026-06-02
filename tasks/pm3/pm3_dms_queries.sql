case
		when greatest(lottr_amp_lottr::numeric, lottr_midd_lottr::numeric, lottr_pmp_lottr::numeric, lottr_we_lottr::numeric) >= 1.5 then 0
		when f_system::numeric = 1 and nhs::numeric IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code::numeric > 0  and faciltype::numeric IN (1, 2, 6) then miles::numeric * ROUND(directionalaadt::numeric, 0) * avg_vehicle_occupancy::numeric
    else 0 end as lottr_interstate_passing

    case
	when  f_system::numeric = 1 and nhs::numeric IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code::numeric > 0  and faciltype::numeric  IN (1, 2, 6)
	then miles::numeric * ROUND(directionalaadt::numeric, 0) * avg_vehicle_occupancy::numeric else 0 end as interstate_person_miles

	case
		when greatest(lottr_amp_lottr::numeric, lottr_midd_lottr::numeric, lottr_pmp_lottr::numeric, lottr_we_lottr::numeric) >= 1.5 then 0
		when f_system::numeric > 1 and nhs::numeric IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code::numeric > 0  and faciltype::numeric IN (1, 2, 6) then miles::numeric * ROUND(directionalaadt::numeric, 0) * avg_vehicle_occupancy::numeric
    else 0 end as lottr_noninterstate_passing
    
    case
	when  f_system::numeric > 1 and nhs::numeric IN (1, 2, 3, 4, 5, 6, 7, 8, 9) and urban_code::numeric > 0  and faciltype::numeric  IN (1, 2, 6)
	then miles::numeric * ROUND(directionalaadt::numeric, 0) * avg_vehicle_occupancy::numeric else 0 end as noninterstate_person_miles