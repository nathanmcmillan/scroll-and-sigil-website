class monster
box 0.6
height 4.0
name Demon Baron
group (monster)(baron)
health 4
speed 0.05
sight 60.0
sound-pain baron-pain
sound-death baron-death
sound-wake baron-scream
sprites
idle baron walk-1
move baron walk-2 baron walk-3 baron walk-0 baron walk-1
melee baron melee-0 baron melee-1
missile baron missile-0 baron missile-1
death baron death-0 baron death-1
end sprites
attack
object
range 0.8
animation melee
damage 1 10
reaction 40 220
type instant
damage-on-frame 1
sound baron-melee
sound-on-frame 0
end object
object
range 40.0
animation missile
damage 2 6
reaction 40 220
type projectile
projectile plasma
damage-on-frame 1
sound baron-missile
sound-on-frame 1
end object
end attack
