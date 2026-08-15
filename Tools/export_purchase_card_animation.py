import bpy
from pathlib import Path

ROOT = Path(r"D:\BIG-SLICK-GAMES\GAMES\Poker Orbit")
BLEND_PATH = ROOT / "Assets" / "Blender" / "purchase-card-animation-source.blend"
GLB_PATH = ROOT / "WebMobile" / "public" / "assets" / "models" / "purchase-card.glb"


def make_mat(name, color, emission=None, strength=0.0, roughness=0.35, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


def cube(name, dimensions, location, material, parent):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    obj.parent = parent
    return obj


def find_animation_source():
    root = bpy.data.objects.get("ANIMATE_ME_PurchaseCard")
    if root and root.animation_data and root.animation_data.action:
        return root

    preferred = bpy.data.objects.get("CardBack") or bpy.data.objects.get("CardFront")
    if preferred and preferred.animation_data and preferred.animation_data.action:
        return preferred

    for obj in bpy.data.objects:
        if obj.type not in {"CAMERA", "LIGHT"} and obj.animation_data and obj.animation_data.action:
            return obj

    raise RuntimeError("No card animation action found in the Blender file")


def action_frame_range(action):
    frames = [
        point.co.x
        for fcurve in action.fcurves
        for point in fcurve.keyframe_points
    ]
    if not frames:
        return 1, 180
    return int(min(frames)), int(max(frames))


bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
source = find_animation_source()
source_action = source.animation_data.action.copy()
source_action.name = "PurchaseCard_UserAnimation"
source_action.use_fake_user = True
source_location = source.location.copy()
source_rotation = source.rotation_euler.copy()
source_scale = source.scale.copy()
frame_start, frame_end = action_frame_range(source_action)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

scene = bpy.context.scene
scene.frame_start = frame_start
scene.frame_end = frame_end
scene.render.fps = 60
scene.frame_set(frame_start)

front_mat = make_mat("CardFaceDynamic", (1.0, 0.96, 0.86, 1.0))
back_mat = make_mat("CardBackNeon", (0.02, 0.09, 0.18, 1.0), (0.0, 0.65, 1.0, 1.0), 0.45)
edge_mat = make_mat("CardEdgeBuyerColor", (0.0, 0.8, 1.0, 1.0), (0.0, 0.8, 1.0, 1.0), 1.8)
gold_mat = make_mat("GoldBevel", (1.0, 0.56, 0.08, 1.0), (1.0, 0.33, 0.0, 1.0), 0.45, metallic=0.42)
glow_mat = make_mat("BuyerGlow", (0.0, 0.75, 1.0, 0.62), (0.0, 0.85, 1.0, 1.0), 3.0)

root = bpy.data.objects.new("ANIMATE_ME_PurchaseCard", None)
bpy.context.collection.objects.link(root)
root.location = source_location
root.rotation_euler = source_rotation
root.scale = source_scale
root.animation_data_create()
root.animation_data.action = source_action

body = cube("CardBody", (2.18, 3.18, 0.075), (0, 0, 0), edge_mat, root)
body.modifiers.new("SoftCardBevel", "BEVEL").width = 0.045
body.modifiers["SoftCardBevel"].segments = 6
body.modifiers.new("WeightedCardNormals", "WEIGHTED_NORMAL")

front = cube("CardFront", (2.04, 3.04, 0.012), (0, -0.001, 0.044), front_mat, root)
back = cube("CardBack", (2.04, 3.04, 0.012), (0, 0.001, -0.044), back_mat, root)

for name, dimensions, location in [
    ("NeonRimTop", (2.18, 0.052, 0.09), (0, 1.62, 0.052)),
    ("NeonRimBottom", (2.18, 0.052, 0.09), (0, -1.62, 0.052)),
    ("NeonRimLeft", (0.052, 3.18, 0.09), (-1.12, 0, 0.052)),
    ("NeonRimRight", (0.052, 3.18, 0.09), (1.12, 0, 0.052)),
]:
    rim = cube(name, dimensions, location, gold_mat, root)
    rim.modifiers.new("RimBevel", "BEVEL").width = 0.026
    rim.modifiers["RimBevel"].segments = 4
    rim.modifiers.new("RimNormals", "WEIGHTED_NORMAL")

bpy.ops.mesh.primitive_torus_add(major_radius=1.33, minor_radius=0.018, major_segments=96, minor_segments=8, location=(0, 0, 0.09))
halo = bpy.context.object
halo.name = "BuyerColorHalo"
halo.scale.y = 1.45
halo.data.materials.append(glow_mat)
halo.parent = root

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(GLB_PATH),
    export_format="GLB",
    export_animations=True,
    export_frame_range=True,
    export_apply=True,
    export_materials="EXPORT",
    export_lights=False,
)
