package main

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/sangnn2012/yelpcamp-api-go/internal/config"
	"github.com/sangnn2012/yelpcamp-api-go/pkg/database"
	"golang.org/x/crypto/bcrypt"
)

type seedUser struct {
	Username string
	Email    string
	Password string
}

type seedCampground struct {
	Name        string
	Price       string
	Image       string
	Location    string
	Description string
}

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "config: %v\n", err)
		os.Exit(1)
	}

	db, err := database.Connect(cfg.Database.URL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "db: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	ctx := context.Background()

	if _, err := db.Exec(ctx, "TRUNCATE comments, campgrounds, users RESTART IDENTITY CASCADE"); err != nil {
		fmt.Fprintf(os.Stderr, "truncate: %v\n", err)
		os.Exit(1)
	}

	users := []seedUser{
		{"john_camper", "john@example.com", "password123"},
		{"jane_hiker", "jane@example.com", "password123"},
		{"demo", "demo@example.com", "demo123"},
	}

	userIDs := make([]string, 0, len(users))
	now := time.Now()
	for _, u := range users {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Fprintf(os.Stderr, "bcrypt: %v\n", err)
			os.Exit(1)
		}
		id := uuid.New().String()
		_, err = db.Exec(ctx,
			`INSERT INTO users (id, username, email, password, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			id, u.Username, u.Email, string(hash), now, now)
		if err != nil {
			fmt.Fprintf(os.Stderr, "insert user %s: %v\n", u.Username, err)
			os.Exit(1)
		}
		userIDs = append(userIDs, id)
		fmt.Printf("  user: %s / %s\n", u.Username, u.Password)
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	for _, cg := range campgrounds {
		authorID := userIDs[rng.Intn(len(userIDs))]
		_, err := db.Exec(ctx,
			`INSERT INTO campgrounds (name, price, image, description, location, author_id, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			cg.Name, cg.Price, cg.Image, cg.Description, cg.Location, authorID, now, now)
		if err != nil {
			fmt.Fprintf(os.Stderr, "insert campground %s: %v\n", cg.Name, err)
			os.Exit(1)
		}
	}

	fmt.Printf("seeded %d users and %d campgrounds\n", len(users), len(campgrounds))
}

var campgrounds = []seedCampground{
	{
		Name:     "Cloud's Rest",
		Price:    "9.00",
		Image:    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
		Location: "Yosemite National Park, California",
		Description: "Experience the breathtaking beauty of Cloud's Rest, a premier camping destination nestled high in the mountains. This campground offers stunning panoramic views of the surrounding peaks and valleys. Wake up above the clouds and watch the sunrise paint the sky in brilliant oranges and pinks.\n\n" +
			"The site features well-maintained tent pads, fire rings, and access to pristine hiking trails. Wildlife is abundant - keep an eye out for deer, eagles, and the occasional mountain lion from a safe distance. The night skies here are phenomenal for stargazing, far from any light pollution.\n\n" +
			"Facilities include vault toilets and a seasonal water spigot. Pack in what you need and be prepared for cooler temperatures at this elevation. This is truly a place where you can disconnect and reconnect with nature.",
	},
	{
		Name:     "Desert Mesa",
		Price:    "12.00",
		Image:    "https://images.unsplash.com/photo-1533873984035-25970ab07461?w=800",
		Location: "Moab, Utah",
		Description: "Desert Mesa offers a unique camping experience in the heart of red rock country. The dramatic landscape features towering sandstone formations, ancient petroglyphs, and some of the most spectacular sunsets you'll ever witness.\n\n" +
			"The campground is situated on a flat mesa with unobstructed 360-degree views. Spring and fall are the ideal seasons to visit when temperatures are mild. Summer visitors should prepare for intense heat during the day and surprisingly cool nights.\n\n" +
			"Each campsite is spacious with excellent privacy between neighbors. The dark sky preserve status makes this location perfect for astrophotography and meteor shower viewing. Don't miss the chance to explore the nearby slot canyons and natural arches.",
	},
	{
		Name:     "Canyon Floor",
		Price:    "15.00",
		Image:    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
		Location: "Grand Canyon, Arizona",
		Description: "Nestled at the bottom of a magnificent canyon, Canyon Floor campground provides a unique perspective on geological time. Towering walls rise hundreds of feet on either side, displaying millions of years of Earth's history in colorful stratified layers.\n\n" +
			"A crystal-clear stream runs through the campground, providing a refreshing swimming hole and excellent fishing opportunities. The canyon walls create natural shade for most of the day, making this an excellent summer destination.\n\n" +
			"Hiking trails lead to ancient cliff dwellings, hidden waterfalls, and scenic overlooks. The acoustics of the canyon make for memorable evenings around the campfire, with sounds echoing off the ancient walls. This is a place that inspires wonder and reflection.",
	},
	{
		Name:     "Whispering Pines",
		Price:    "18.00",
		Image:    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800",
		Location: "Lake Tahoe, California",
		Description: "Set within an ancient pine forest, Whispering Pines campground offers the quintessential woodland camping experience. The towering trees create a natural cathedral, with sunlight filtering through the canopy in golden shafts.\n\n" +
			"The forest floor is carpeted with soft pine needles, making for comfortable camping. The air is fresh and fragrant with the scent of pine. Wildlife is abundant, including deer, squirrels, and a variety of songbirds that create a natural symphony at dawn.\n\n" +
			"The campground features well-spaced sites connected by quiet forest trails. A small lake is within walking distance, perfect for kayaking, fishing, or simply enjoying the peaceful ambiance. Evening campfires are magical as the stars appear through gaps in the tree cover.",
	},
	{
		Name:     "Coastal Bluffs",
		Price:    "22.00",
		Image:    "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800",
		Location: "Big Sur, California",
		Description: "Perched on dramatic coastal bluffs overlooking the Pacific Ocean, this campground offers front-row seats to some of nature's most spectacular shows. Watch migrating whales, playful sea otters, and colorful tide pools teeming with life.\n\n" +
			"Fall asleep to the rhythmic sound of waves crashing against the rocks below. Wake up to stunning sunrises over the water. The marine layer often rolls in during the evening, creating an ethereal misty atmosphere.\n\n" +
			"Trails wind along the clifftops and down to secluded beaches accessible only at low tide. The fishing here is excellent, and the nearby town offers fresh seafood restaurants and local artisan shops. This is coastal camping at its finest.",
	},
	{
		Name:     "Mountain Meadow",
		Price:    "14.00",
		Image:    "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800",
		Location: "Rocky Mountain National Park, Colorado",
		Description: "Mountain Meadow campground sits in a pristine alpine meadow surrounded by towering peaks. Wildflowers blanket the landscape in summer, creating a colorful paradise for photographers and nature lovers alike.\n\n" +
			"The crisp mountain air and peaceful surroundings make this an ideal retreat from the hustle of daily life. Elk and mule deer are frequent visitors to the meadow, especially at dawn and dusk.\n\n" +
			"Nearby trails lead to alpine lakes, cascading waterfalls, and panoramic summit viewpoints. The campground offers both tent sites and RV hookups with modern restroom facilities.",
	},
	{
		Name:     "Redwood Haven",
		Price:    "25.00",
		Image:    "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=800",
		Location: "Redwood National Park, California",
		Description: "Camp among the giants at Redwood Haven, where ancient redwood trees tower hundreds of feet overhead. These magnificent trees, some over 2,000 years old, create an atmosphere of timeless wonder.\n\n" +
			"The forest floor is a lush carpet of ferns and sorrel, dappled with filtered sunlight. Morning fog drifts through the trees, adding to the mystical ambiance. Banana slugs, Roosevelt elk, and countless bird species call this forest home.\n\n" +
			"Well-maintained trails wind through the old-growth forest, connecting to the larger park trail system. The campground features rustic charm with modern amenities.",
	},
	{
		Name:     "Lakeside Retreat",
		Price:    "20.00",
		Image:    "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800",
		Location: "Glacier National Park, Montana",
		Description: "Lakeside Retreat offers premium waterfront camping on the shores of a pristine glacial lake. The crystal-clear waters reflect the surrounding peaks like a mirror, creating postcard-perfect views.\n\n" +
			"Kayaking, canoeing, and fishing are popular activities. The lake is stocked with trout, and the fishing is excellent. Swimming is refreshing but brisk - these are glacier-fed waters after all!\n\n" +
			"Bear-proof food storage is provided at each site. The Going-to-the-Sun Road is nearby, offering access to some of the most spectacular mountain scenery in North America.",
	},
	{
		Name:     "Desert Oasis",
		Price:    "16.00",
		Image:    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
		Location: "Joshua Tree, California",
		Description: "Desert Oasis is a hidden gem in the Mojave Desert, featuring the iconic Joshua trees that give the park its name. These otherworldly plants create a surreal landscape that feels like another planet.\n\n" +
			"The campground is situated near fascinating rock formations popular with climbers. Sunrise and sunset paint the desert in spectacular colors, and the night sky here is among the darkest in Southern California.\n\n" +
			"Spring brings a stunning wildflower bloom when conditions are right. The campground offers spacious sites with excellent privacy and stunning desert views.",
	},
	{
		Name:     "Cascade Falls",
		Price:    "19.00",
		Image:    "https://images.unsplash.com/photo-1455496231601-e6195da1f841?w=800",
		Location: "Olympic National Park, Washington",
		Description: "Cascade Falls campground is named for the magnificent waterfall just a short hike from camp. The temperate rainforest setting is lush and green, with moss-covered trees and fern-lined trails.\n\n" +
			"The constant mist from the falls keeps everything fresh and green. Rainbow trout inhabit the streams, and the fishing is excellent. Roosevelt elk roam the valleys, and black bears occasionally pass through.\n\n" +
			"The campground offers both primitive and developed sites. Hot showers are available at the main facility. The nearby coast offers tide pooling and beach walking opportunities.",
	},
	{
		Name:     "Alpine Vista",
		Price:    "17.00",
		Image:    "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800",
		Location: "North Cascades, Washington",
		Description: "Alpine Vista sits at the edge of the tree line, offering commanding views of jagged peaks and pristine wilderness. This is backcountry camping at its finest, with minimal development and maximum natural beauty.\n\n" +
			"The campground serves as a basecamp for mountaineering expeditions and day hikes into the alpine zone. Mountain goats are frequently spotted on the nearby cliffs, and marmots whistle warnings from the rocky slopes.\n\n" +
			"Facilities are limited - pack in everything you need. The reward is solitude and scenery that few ever experience. Clear nights offer unparalleled stargazing opportunities.",
	},
	{
		Name:     "Riverstone",
		Price:    "13.00",
		Image:    "https://images.unsplash.com/photo-1414016642750-7fdd78dc33d9?w=800",
		Location: "Zion National Park, Utah",
		Description: "Riverstone campground lies along the banks of the Virgin River, with stunning views of Zion's famous red rock cliffs. The river provides a refreshing respite from the desert heat and excellent opportunities for wading and swimming.\n\n" +
			"The iconic Angels Landing and The Narrows are accessible from camp. The shuttle system makes exploring the park easy and car-free. Sunset on the canyon walls is a daily spectacle not to be missed.\n\n" +
			"Cottonwood trees provide welcome shade during the hot summer months. The campground fills early during peak season, so reservations are strongly recommended.",
	},
	{
		Name:     "Pinecone Ridge",
		Price:    "11.00",
		Image:    "https://images.unsplash.com/photo-1496545672447-f699b503d270?w=800",
		Location: "Sequoia National Park, California",
		Description: "Pinecone Ridge offers camping in the shadow of the world's largest trees. The giant sequoias here are truly humbling - some are over 3,000 years old and 300 feet tall.\n\n" +
			"The General Sherman Tree, the largest living thing on Earth by volume, is a short drive away. Hiking trails connect to groves of these magnificent giants throughout the park.\n\n" +
			"The campground sits at 6,500 feet elevation, providing relief from summer valley heat. Black bears are common - proper food storage is required. The mountain air is fresh and invigorating.",
	},
	{
		Name:     "Sunrise Point",
		Price:    "21.00",
		Image:    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800",
		Location: "Bryce Canyon, Utah",
		Description: "Sunrise Point campground offers front-row seats to one of nature's most bizarre and beautiful landscapes. The hoodoos - tall, thin rock spires - glow orange and red in the early morning light.\n\n" +
			"The rim trail passes directly by the campground, offering easy access to multiple viewpoints. Below the rim, a maze of trails winds through the hoodoo formations, offering endless exploration opportunities.\n\n" +
			"At 8,000 feet, nights are cool even in summer. The dark skies here are exceptional - Bryce is an International Dark Sky Park. Astronomy programs are offered regularly by park rangers.",
	},
	{
		Name:     "Hidden Valley",
		Price:    "15.00",
		Image:    "https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=800",
		Location: "Death Valley, California",
		Description: "Hidden Valley campground offers a unique desert camping experience in one of Earth's most extreme environments. Despite its harsh reputation, Death Valley teems with life adapted to survive here.\n\n" +
			"Spring wildflower blooms can be spectacular when winter rains cooperate. The salt flats, sand dunes, and colorful badlands offer incredible photography opportunities. Sunrise at Zabriskie Point is unforgettable.\n\n" +
			"Winter and spring are the ideal seasons to visit - summer temperatures can exceed 120°F. The star-filled night sky is remarkable, and the silence of the desert is profound.",
	},
	{
		Name:     "Evergreen Grove",
		Price:    "18.00",
		Image:    "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?w=800",
		Location: "Great Smoky Mountains, Tennessee",
		Description: "Evergreen Grove nestles in a quiet hollow surrounded by the ancient Appalachian forest. These mountains are among the oldest on Earth, worn smooth by millions of years of weather.\n\n" +
			"The biodiversity here is astounding - more tree species exist in this park than in all of Europe. Synchronous fireflies create magical displays in early summer. Black bears, white-tailed deer, and wild turkeys are common.\n\n" +
			"The campground features well-appointed sites along a babbling brook. Historic cabins and churches dot the landscape, remnants of the communities that once called these hollows home.",
	},
}
