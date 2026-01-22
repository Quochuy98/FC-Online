/**
 * Examples of querying stats with the new schema
 * Stats now use English keys with Vietnamese names
 */

require('dotenv').config();

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fconline';
const DB_NAME = process.env.DB_NAME || 'fconline';

async function exampleQueries() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const players = db.collection('players');
    
    // Example 1: Find fast players (speed >= 135)
    console.log('=== Example 1: Fast Players (speed >= 135) ===');
    const fastPlayers = await players
      .find({ 
        'stats.speed.value': { $gte: 135 },
        season: 'EL'
      })
      .limit(5)
      .toArray();
    
    fastPlayers.forEach(player => {
      console.log(`${player.name} (${player.position}): Speed = ${player.stats.speed.value}`);
    });
    
    // Example 2: Find players with good finishing (finishing >= 140)
    console.log('\n=== Example 2: Good Finishers (finishing >= 140) ===');
    const goodFinishers = await players
      .find({ 
        'stats.finishing.value': { $gte: 140 },
        season: 'EL'
      })
      .limit(5)
      .toArray();
    
    goodFinishers.forEach(player => {
      console.log(`${player.name} (${player.position}): Finishing = ${player.stats.finishing.value}`);
    });
    
    // Example 3: Find well-rounded attackers
    console.log('\n=== Example 3: Well-rounded Attackers ===');
    const wellRoundedAttackers = await players
      .find({ 
        'stats.speed.value': { $gte: 130 },
        'stats.finishing.value': { $gte: 130 },
        'stats.dribbling.value': { $gte: 130 },
        season: 'EL',
        position: { $in: ['ST', 'LW', 'RW', 'CF'] }
      })
      .limit(5)
      .toArray();
    
    wellRoundedAttackers.forEach(player => {
      console.log(`${player.name} (${player.position}):`);
      console.log(`  Speed: ${player.stats.speed.value}`);
      console.log(`  Finishing: ${player.stats.finishing.value}`);
      console.log(`  Dribbling: ${player.stats.dribbling.value}`);
    });
    
    // Example 4: Top 10 fastest players using aggregation
    console.log('\n=== Example 4: Top 10 Fastest Players ===');
    const topSpeed = await players.aggregate([
      { $match: { 'stats.speed.value': { $exists: true }, season: 'EL' } },
      { $sort: { 'stats.speed.value': -1 } },
      { $limit: 10 },
      { 
        $project: { 
          name: 1, 
          position: 1,
          speed: '$stats.speed',
          acceleration: '$stats.acceleration'
        } 
      }
    ]).toArray();
    
    topSpeed.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.position}):`);
      console.log(`   ${player.speed.name}: ${player.speed.value}`);
      console.log(`   ${player.acceleration.name}: ${player.acceleration.value}`);
    });
    
    // Example 5: Display stats with Vietnamese names
    console.log('\n=== Example 5: Display Stats with Vietnamese Names ===');
    const onePlayer = await players.findOne({ 
      playerId: 'cristiano-ronaldo-zzwyoyoy',
      season: 'EL'
    });
    
    if (onePlayer) {
      console.log(`\nStats for ${onePlayer.name}:`);
      
      // Attack stats
      console.log('\nAttack Stats:');
      ['speed', 'acceleration', 'finishing', 'shotPower', 'longShots'].forEach(key => {
        if (onePlayer.stats[key]) {
          const stat = onePlayer.stats[key];
          console.log(`  ${stat.name}: ${stat.value}`);
        }
      });
      
      // Dribbling stats
      console.log('\nDribbling Stats:');
      ['dribbling', 'ballControl', 'agility', 'balance'].forEach(key => {
        if (onePlayer.stats[key]) {
          const stat = onePlayer.stats[key];
          console.log(`  ${stat.name}: ${stat.value}`);
        }
      });
    }
    
    // Example 6: Calculate average stats
    console.log('\n=== Example 6: Calculate Average Attack Stats ===');
    const avgStats = await players.aggregate([
      { 
        $match: { 
          season: 'EL',
          position: 'ST'
        } 
      },
      {
        $group: {
          _id: null,
          avgSpeed: { $avg: '$stats.speed.value' },
          avgFinishing: { $avg: '$stats.finishing.value' },
          avgShotPower: { $avg: '$stats.shotPower.value' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    if (avgStats.length > 0) {
      const avg = avgStats[0];
      console.log(`Average stats for ST position (${avg.count} players):`);
      console.log(`  Speed: ${avg.avgSpeed.toFixed(2)}`);
      console.log(`  Finishing: ${avg.avgFinishing.toFixed(2)}`);
      console.log(`  Shot Power: ${avg.avgShotPower.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run examples
exampleQueries().catch(console.error);
