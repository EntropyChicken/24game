let channel;
if(window.supabase === undefined){
    console.warn("window.supabase is undefined. channel will be undefined")
}
else{
    let supabaseClient = window.supabase.createClient(
        "https://yjiizqjjuunbvmkuxulv.supabase.co",
        "sb_publishable_UgcUH946WkpvMmPIvHN0Yg_cDczSY6T",
        { auth: { persistSession: false } }
    );
    channel = supabaseClient.channel("main-room", {
        config: { broadcast: { self: true, ack: true } }
    });
}