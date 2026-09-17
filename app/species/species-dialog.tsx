"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesDialog({ species, sessionId }: { species: Species; sessionId: string }) {
  const [open, setOpen] = useState<boolean>(false); // JZ: Used for components to remember some information and display it

  const isAuthor = sessionId === species.author;
  const [isEditing, setIsEditing] = useState(false);
  // Define kingdom enum for use in Zod schema and displaying dropdown options in the form
  const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

  // Use Zod to define the shape + requirements of a Species entry; used in form validation
  const speciesSchema = z.object({
    scientific_name: z
      .string()
      .trim()
      .min(1)
      .transform((val) => val?.trim()),
    common_name: z
      .string()
      .nullable()
      // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
      .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
    kingdom: kingdoms,
    total_population: z.number().int().positive().min(1).nullable(),
    description: z
      .string()
      .nullable()
      // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
      .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  });

  const defaultValues: Partial<FormData> = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    total_population: species.total_population,
    description: species.description,
    kingdom: species.kingdom,
  };

  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });
  type FormData = z.infer<typeof speciesSchema>;

  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    // Instantiate Supabase client (for client components) and make update based on input data
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase // changed this portion: taking parts from add-species and profile-form
      .from("species")
      .update({
        scientific_name: data.scientific_name,
        common_name: data.common_name,
        total_population: data.total_population,
        description: data.description,
      })
      .eq("id", species.id);

    // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    // Because Supabase errors were caught above, the remainder of the function will only execute upon a successful edit

    setIsEditing(false);

    // Reset form values to the data values that have been processed by zod.
    // This is helpful to do after EDITING, so that the user sees any changes that have occurred during transformation
    form.reset(data);

    // Router.refresh does not affect ProfileForm because it is a client component, but it will refresh the initials in the user-nav in the event of a username change
    router.refresh();

    return toast({
      title: "Card updated successfully!",
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    // If edit canceled, reset the form data to the original values which were set from props
    form.reset(defaultValues);
    // Turn off editing mode
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* What trigers this Dialog to open? Pressing the 'Learn More' Button */}
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>

      {/* Top Half of the Dialog (before the line break) */}
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle> {species.scientific_name} </DialogTitle>
          <DialogDescription>Learn more about the {species.common_name}!</DialogDescription>
        </DialogHeader>
        <hr className="my-2" />

        {species.image && (
          <div className="relative h-64 w-full">
            <Image src={species.image} alt={species.scientific_name} fill className="object-cover" />
          </div>
        )}

        {/* Form begin, allowing users to edit */}
        <Form {...form}>
          <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
            {/* Kingdom form field*/}
            <FormField
              control={form.control}
              name="kingdom"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="font-bold">Kingdom:</FormLabel>
                    {isEditing ? (
                      <Select onValueChange={(value) => field.onChange(kingdoms.parse(value))} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a kingdom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {kingdoms.options.map((kingdom, index) => (
                              <SelectItem key={index} value={kingdom}>
                                {kingdom}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p>{field.value}</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Population form field*/}
            <FormField
              control={form.control}
              name="total_population"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="font-bold">Population:</FormLabel>
                    {isEditing ? (
                      <FormControl>
                        <Input
                          type="number"
                          className="text-sm"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(+e.target.value)}
                        />
                      </FormControl>
                    ) : (
                      <p>{field.value}</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description form field*/}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Description:</FormLabel>
                  {isEditing ? (
                    <FormControl>
                      <Textarea className="h-32 text-sm" {...field} value={field.value ?? ""} />
                    </FormControl>
                  ) : (
                    <p>{field.value}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditionally render action buttons depending on if the form is in viewing/editing mode */}
            {isAuthor && (
              <div className="mt-4 flex">
                {isEditing ? (
                  <>
                    <Button type="submit" className="mr-2">
                      Update
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  // Toggle editing mode
                  <Button onClick={startEditing}>Edit</Button>
                )}
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
