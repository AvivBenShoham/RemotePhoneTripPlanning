// Toggleable optional activities — copied verbatim from the original planner.
export const optionals = {
  beachhop:{label:"Optional beach hop (same road)",note:"Both sit off the El Limón–Las Terrenas road. Skip either freely.",def:"moron",
    choices:{moron:{name:"Playa Morón",rec:true,cost:10,desc:"A quiet, wild cove — golden sand, clear turquoise water, backed by dense coconut palms. No reef at the shore, but you can snorkel the rock formations at either end. Has a small beach restaurant. Reached ~15–20 min from El Limón down a rough unpaved track."},
      ermitano:{name:"Playa Ermitaño",cost:25,desc:"One of the most beautiful in the area and genuinely crystal-clear — baby-blue, shallow water you can wade far out into, with fish and rock formations. White-gold sand framed by green hills; often nearly deserted because there's no road in. No facilities, so bring water and shoes for the rocky entry; reached by a short boat from Playa Morón, sea permitting."},
      skip:{name:"Skip it",cost:0,desc:"Return to Las Terrenas after the waterfall."}}},
  slowbeach:{label:"Choose your slow beach",note:"Pick on the day. Both face roughly west/northwest, so both can catch the sunset over the water.",def:"coson",
    choices:{bonita:{name:"Playa Bonita",cost:8,desc:"A calm, palm-lined stretch ~10 min from town by motoconcho, or walkable. A few small hotels along it, but easygoing and rarely packed."},
      coson:{name:"Playa Cosón",rec:true,cost:35,desc:"A long, open, largely undeveloped beach ~15–20 min west of town, with clear water and a handful of beach restaurants. Its openness makes it the better sunset spot. Farther out, so the taxi costs a bit more."}}},
  night:{label:"Punta Cana night out",note:"Confirm Monday shows first (wa.me/18094661111).",def:"strip",
    choices:{strip:{name:"El Cortecito strip",rec:true,cost:25,desc:"Local bars, walkable, cheap. Plenty after a travel day."},
      coco:{name:"Coco Bongo",cost:170,desc:"⚠ Show-club with performances; ticket ~$85pp. Confirm it operates on a Monday before planning around it."}}}
};

export const NIGHTLY_DEFAULT = 60;

// Default to-do checklist (shared & live; seeds a fresh trip).
export const DEFAULT_TODO = [
  "Book flights",
  "Find the best area to sleep in Las Terrenas",
  "Book hotels",
  "Reserve activities",
  "Do the entrance E-Ticket",
  "Come with Karol's vibess",
];
