SELECT "BeginDate", 
count(1) as num_tmcs, 
sum("SegmentLength") as total_miles,
Round(sum(case 
	when greatest("LOTTRAMP", "LOTTRMIDD", "LOTTRPMP", "LOTTRWE") >= 1.5 then 0
	when "FSystem" = 1 and "NHS" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9') and "UrbanCode" is not null  and "FacilityType" IN ('1', '2', '6') then "SegmentLength" * ROUND("DIRAADT", 0) * "OCCFAC"
    else 0 
end) /
sum(case 
	when  "FSystem" = 1 and "NHS" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9') and "UrbanCode" is not null  and "FacilityType" IN ('1', '2', '6') 
	then  "SegmentLength" * ROUND("DIRAADT", 0) * "OCCFAC" else 0 end) * 100, 1) as lottrinterstate,
Round(sum(case 
	when greatest("LOTTRAMP", "LOTTRMIDD", "LOTTRPMP", "LOTTRWE") >= 1.5 then 0
	when "FSystem" > 1 and "NHS" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9') and "UrbanCode" is not null  and "FacilityType" IN ('1', '2', '6') then "SegmentLength" * ROUND("DIRAADT", 0) * "OCCFAC"
    else 0 
end) /
sum(case 
	when "FSystem" > 1 and "NHS" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9') and "UrbanCode" is not null  and "FacilityType" IN ('1', '2', '6') 
	then  "SegmentLength" * ROUND("DIRAADT", 0) * "OCCFAC" else 0 end) * 100, 1) as lottrnon_interstate,
round(sum(case 
	when "FSystem" = 1 and "NHS" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9') and "UrbanCode" is not null  and "FacilityType" IN ('1', '2', '6') 
	then (greatest("TTTRAMP","TTTRMIDD","TTTRPMP","TTTRWE","TTTROVN") * "SegmentLength")
	else 0
end) / sum(case 
	when "FSystem" = 1 and "NHS" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9') and "UrbanCode" is not null  and "FacilityType" IN ('1', '2', '6') 
	then ("SegmentLength")
	else 0
end),2) as tttrinterstate,
round(sum("PHED"),1) as phed
grom x
group by 1
