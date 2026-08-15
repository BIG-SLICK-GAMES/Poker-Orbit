import bpy
import math
from mathutils import Vector

OUTPUT_PATH = r"D:\BIG-SLICK-GAMES\GAMES\Poker Orbit\WebMobile\public\assets\models\purchase-card.glb"

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 104
scene.render.fps = 60


def make_mat(name, color, emission=None, strength=0.0, roughness=0.35, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    return mat


front_mat = make_mat("CardFaceDynamic", (1.0, 0.96, 0.86, 1.0))
back_mat = make_mat("CardBackNeon", (0.02, 0.09, 0.18, 1.0), (0.0, 0.65, 1.0, 1.0), 0.45)
edge_mat = make_mat("CardEdgeBuyerColor", (0.0, 0.8, 1.0, 1.0), (0.0, 0.8, 1.0, 1.0), 1.8)
gold_mat = make_mat("GoldBevel", (1.0, 0.56, 0.08, 1.0), (1.0, 0.33, 0.0, 1.0), 0.45, metallic=0.42)
glow_mat = make_mat("BuyerGlow", (0.0, 0.75, 1.0, 0.62), (0.0, 0.85, 1.0, 1.0), 3.0)


def cube(name, scale, location, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


root = bpy.data.objects.new("PurchaseCardRig", None)
bpy.context.collection.objects.link(root)

body = cube("CardBody", (2.18, 3.18, 0.075), (0, 0, 0), edge_mat)
body.parent = root
bevel = body.modifiers.new("SoftCardBevel", "BEVEL")
bevel.width = 0.045
bevel.segments = 6
body.modifiers.new("WeightedCardNormals", "WEIGHTED_NORMAL")

front = cube("CardFront", (2.04, 3.04, 0.011), (0, -0.001, 0.044), front_mat)
front.parent = root

back = cube("CardBack", (2.04, 3.04, 0.011), (0, 0.001, -0.044), back_mat)
back.parent = root

rim_top = cube("NeonRimTop", (2.18, 0.052, 0.09), (0, 1.62, 0.052), gold_mat)
rim_bottom = cube("NeonRimBottom", (2.18, 0.052, 0.09), (0, -1.62, 0.052), gold_mat)
rim_left = cube("NeonRimLeft", (0.052, 3.18, 0.09), (-1.12, 0, 0.052), gold_mat)
rim_right = cube("NeonRimRight", (0.052, 3.18, 0.09), (1.12, 0, 0.052), gold_mat)
for obj in (rim_top, rim_bottom, rim_left, rim_right):
    obj.parent = root
    bevel = obj.modifiers.new("RimBevel", "BEVEL")
    bevel.width = 0.026
    bevel.segments = 4
    obj.modifiers.new("RimNormals", "WEIGHTED_NORMAL")

bpy.ops.mesh.primitive_torus_add(major_radius=1.33, minor_radius=0.018, major_segments=96, minor_segments=8, location=(0, 0, 0.09))
glow = bpy.context.object
glow.name = "BuyerColorHalo"
glow.scale.y = 1.45
glow.data.materials.append(glow_mat)
glow.parent = root

spark_positions = [(-0.78, 1.06, 0.13), (0.82, 0.92, 0.13), (-0.62, -1.08, 0.13), (0.66, -1.02, 0.13)]
for index, pos in enumerate(spark_positions):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.045, location=pos)
    spark = bpy.context.object
    spark.name = f"JoySpark_{index + 1}"
    spark.data.materials.append(glow_mat)
    spark.parent = root

root.rotation_euler = (math.radians(70), 0, math.radians(-5))
root.location = (0, 0, 0)
root.scale = (1, 1, 1)

keyframes = [
    (1, (0, -0.05, 0), (70, 0, -5), 1.0),
    (15, (0, 0.00, 0.22), (67, 0, 3), 1.08),
    (36, (0, 0.03, 0.72), (64, 178, -10), 1.22),
    (58, (0, -0.02, 0.58), (67, 360, 8), 1.12),
    (76, (0.08, 0.02, 0.78), (64, 540, -6), 1.18),
    (104, (2.8, 0.18, 1.72), (58, 760, 28), 0.46),
]

for frame, loc, rot, scale in keyframes:
    scene.frame_set(frame)
    root.location = loc
    root.rotation_euler = tuple(math.radians(v) for v in rot)
    root.scale = (scale, scale, scale)
    root.keyframe_insert(data_path="location", frame=frame)
    root.keyframe_insert(data_path="rotation_euler", frame=frame)
    root.keyframe_insert(data_path="scale", frame=frame)

for obj in (glow,):
    for frame, scale, strength in [(1, 0.62, 1.4), (34, 1.12, 4.8), (62, 1.4, 3.4), (104, 2.1, 0.0)]:
        scene.frame_set(frame)
        obj.scale = (scale, scale * 1.45, scale)
        obj.keyframe_insert(data_path="scale", frame=frame)

for action in bpy.data.actions:
    for fcurve in action.fcurves:
        for key in fcurve.keyframe_points:
            key.interpolation = "SINE"

bpy.ops.object.light_add(type="AREA", location=(0, -3.5, 4.0))
light = bpy.context.object
light.name = "PurchaseCardKeyLight"
light.data.energy = 520
light.data.size = 4

bpy.ops.object.camera_add(location=(0, -6.2, 1.65), rotation=(math.radians(78), 0, 0))
bpy.context.scene.camera = bpy.context.object

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format="GLB",
    export_animations=True,
    export_frame_range=True,
    export_apply=True,
    export_materials="EXPORT",
    export_lights=True,
)
