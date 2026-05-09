pada beberapa kasus, suatu event dapat ditrigger dari area yang luas, yang mana apabila menggunakan event normal akan sulit.

maka dari itu saya ingin memanfaatkan region, dimana saya butuh plugin yang trigger event lewat region.

flownya begini, akan ada 1 event sebagai hub trigger event ini yang akan dijalankan paralel, plugin akan ditrigger via comment, dimana formatnya begini
<RegToEvent: [no region], [cara trigger ada 2 yaitu A (Action) dan T (Touch)], [nama event yang ditrigger]>
contohnya = <RegToEvent: 2, A, EVA_0001> artinya saat player melakukan action pada region 2, dia akan otomatis menjalankan EVA_0001

event hub yang paralel tadi memungkinkan menampung banyak event trigger lewat komentar, gak cuman 1

OUTPUT:
Plugin RegionToEvent.js