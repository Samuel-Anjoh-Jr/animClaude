---
name: "ai-motion-website-builder"
description: "Recreate any animated or video-driven website from a reference (Pinterest, Motion Sites, other sites): make the image/video assets with free AI tools, then build the page in Claude Code or Google AI Studio."
---

# AI Motion Website Builder

A general workflow for turning a reference (a Pinterest video, a Motion Sites design, any site with motion) into a working animated website using AI tools. It is based on a tutorial that built a cursor-following character page, but the steps apply to any motion style: looping hero videos, scroll-driven video, parallax, hover effects, character animation, product reveals, and so on.

This skill covers only how to make the thing. It does not cover publishing, pricing, finding clients or marketing.

## Step 0: Ask what it is for and which builder to use
Before starting, ask the user (keep it short, skip anything they've already said):
- What is the site for? (portfolio, product, brand, client project, practice, just exploring)
- Do they have a reference? (Pinterest video, Motion Sites prompt, a live site, a screenshot)
- Any constraints? (brand colors, fixed character or product, must work on mobile, no paid tools)
- **Which builder should I use: Claude Code or Google AI Studio?** Ask this every time unless they've already said. Claude Code is the default suggestion if they have a subscription, since it builds in a real project folder and handles edits and fixes well. Google AI Studio is the free option and needs no setup. Use their answer in Step 5.

Use the answers to tune everything below: tone and style of assets, how polished the copy needs to be, how many sections, and whether the motion should be subtle or dramatic. If they don't know or don't care, proceed with sensible defaults and say which you picked.

## Step 1: Analyze the reference
Work out what the reference actually does before making anything:
- **Motion type:** what moves, and what triggers it (autoplay loop, cursor, scroll, hover, click)?
- **Assets needed:** one still image, several stills in different poses, a short clip, a looping background, several clips?
- **Layout and style:** sections, typography, color palette, mood.

If the reference is a Motion Sites design, copy its prompt (motionsites.ai has hundreds of prompts, free, no account). If it is another website, a design-copying tool such as getdesign.ai can extract its design. If it is a Pinterest video or screenshot, describe the motion and layout in words and use that as the build prompt later.

Write a short asset list (for example: "1 hero still, 1 start frame, 1 end frame, 1 five-second clip") so the next steps are concrete.

## Step 2: Make the base image
1. Get or find a source image that matches the style (an image site, Pinterest, or the user's own).
2. Generate a clean base frame with an image model (ChatGPT free tier or similar). Example prompt pattern:
   > Create image like this, but [change: camera direction, expression, pose, background]. 16:9 aspect ratio.
3. Use 16:9 for desktop web heroes, 9:16 for mobile-first or vertical designs, and 1:1 only if the design calls for it. If the tool ignores the ratio, expand or crop manually.
4. Do not copy a recognizable existing character, brand or artwork. Use the reference for style and composition, and make the subject original or licensed.

## Step 3: Make variant frames (if the motion needs them)
If the motion goes between states (look left to right, product closed to open, day to night), generate each state from the base image with a single-change prompt:
> Make him look to the right side.
Keep everything else identical across frames (subject, lighting, framing, background) so the animation between them is clean. Export as JPEG with clear file names.

Skip this step when the design only needs one still or a single generated clip.

## Step 4: Animate with image-to-video
The tutorial used Kling (free credits on signup). Any image-to-video tool with similar controls works.
1. Choose Image to Video. Use multi-shot or start/end frame mode when you have two frames; use a single image plus a motion prompt otherwise.
2. Upload start frame and end frame. If the motion runs backward, swap them.
3. Prompt:
   - Two frames: a short word like `animate` is enough, since the model infers the motion between them.
   - Single image: describe the motion plainly ("slow camera push in, hair moving slightly").
4. Settings: keep clips short (4 to 5 seconds), turn audio off unless the site needs sound, and note the credit cost before generating since free credits are limited.
5. Download the MP4, or copy its URL. Check that the clip loops or ends cleanly where the design needs it.

## Step 5: Build the page
Use the builder the user chose in Step 0. The method is the same in both: run the reference prompt once as written, then change things in small, narrow steps.

**Option A: Claude Code**
1. Create a project folder (plain HTML/CSS/JS, or the framework the user prefers) and put the generated video and image assets in it.
2. Give Claude Code the reference prompt (from Motion Sites, a design-copy tool, or your written description of layout and motion) as-is the first time, and tell it to use the local asset files. Ask for a responsive page.
3. Run the page locally and look at it in the browser before changing anything.
4. Make each later change as its own request, and tell Claude Code to leave everything else alone.

**Option B: Google AI Studio (free)**
1. Open Google AI Studio.
2. Paste the reference prompt as-is the first time. It should produce a responsive page in one pass.
3. If the asset is a hosted link, paste the URL in; otherwise upload it.

**In both options**
- Swap in the user's asset with a narrow instruction so working behavior isn't regenerated:
  > Replace the video link with this one. Do not change anything about the functionality. Just replace the link. [URL or file path]
  The same pattern works for images or other assets.
- Iterate with one change per message (colors, text color, copy, spacing, fonts):
  > Change all text colors to white instead of black.
- When a change breaks something, say what broke and ask for a fix that keeps everything else unchanged.

## Step 6: Check the result
- Does the motion behave like the reference (trigger, speed, direction)?
- Does it work on mobile and desktop widths?
- Do the video or image links load, and does the page stay light enough to load fast?
- Does the style match the purpose from Step 0?

Stop here. The user handles publishing and everything after.

## Notes
- Tool names and free tiers change. Check current limits before promising something is free, and offer an equivalent free tool if one is unavailable.
- Source tutorial: https://www.youtube.com/watch?v=GPpYwjMoLio